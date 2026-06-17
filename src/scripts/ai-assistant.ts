/**
 * TCI AI Assistant — local knowledge base, zero backend, zero API keys.
 * Voice: SpeechSynthesis (prefers female voices: Aria, Jenny, Google US
 * English, Samantha, Victoria, Karen, Susan, Zira) + Web Speech recognition
 * where supported. No autoplay: speech only happens after an explicit user
 * action (voice toggle on, or per-message "Speak"). Speech is cancelled on
 * close, mute, and page navigation.
 */
import gsap from "gsap";
import { assistantConfig, intents, quickQuestions } from "../data/assistantKnowledge";

type Status = "idle" | "listening" | "thinking" | "speaking" | "muted";

const PREFERRED_VOICES = [
  "Microsoft Aria", "Microsoft Jenny", "Google US English",
  "Samantha", "Victoria", "Karen", "Susan", "Zira"
];

export function initAssistant() {
  const root = document.querySelector<HTMLElement>("[data-assistant]");
  if (!root || root.dataset.ready) return;
  root.dataset.ready = "1";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const orb = root.querySelector<HTMLButtonElement>("[data-assistant-orb]")!;
  const panel = root.querySelector<HTMLElement>("[data-assistant-panel]")!;
  const closeBtn = root.querySelector<HTMLButtonElement>("[data-assistant-close]")!;
  const log = root.querySelector<HTMLElement>("[data-assistant-log]")!;
  const form = root.querySelector<HTMLFormElement>("[data-assistant-form]")!;
  const input = root.querySelector<HTMLInputElement>("[data-assistant-input]")!;
  const micBtn = root.querySelector<HTMLButtonElement>("[data-assistant-mic]")!;
  const voiceToggle = root.querySelector<HTMLButtonElement>("[data-assistant-voice]")!;
  const muteBtn = root.querySelector<HTMLButtonElement>("[data-assistant-mute]")!;
  const stopBtn = root.querySelector<HTMLButtonElement>("[data-assistant-stop]")!;
  const statusEl = root.querySelector<HTMLElement>("[data-assistant-status]")!;
  const wave = root.querySelector<HTMLElement>("[data-assistant-wave]")!;
  const chips = root.querySelector<HTMLElement>("[data-assistant-chips]")!;

  let open = false;
  let voiceOn = false;   /* speak answers automatically once user enables it */
  let muted = false;
  let status: Status = "idle";
  let greeted = false;
  let voices: SpeechSynthesisVoice[] = [];
  let typingTimer: number | undefined;

  const synth: SpeechSynthesis | undefined = "speechSynthesis" in window ? window.speechSynthesis : undefined;

  /* ---------- voices: cache + refresh ---------- */
  const loadVoices = () => {
    if (!synth) return;
    const all = synth.getVoices();
    if (all.length) voices = all;
  };
  loadVoices();
  synth?.addEventListener?.("voiceschanged", loadVoices);

  const pickVoice = (): SpeechSynthesisVoice | undefined => {
    if (!voices.length) loadVoices();
    for (const name of PREFERRED_VOICES) {
      const v = voices.find((vc) => vc.name.includes(name));
      if (v) return v;
    }
    const female = voices.find((v) => /female|woman/i.test(v.name) && v.lang.startsWith("en"));
    return female ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  };

  /* ---------- status ---------- */
  const setStatus = (next: Status) => {
    status = next;
    const labels: Record<Status, string> = {
      idle: "Online", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…", muted: "Muted"
    };
    statusEl.textContent = labels[next];
    statusEl.dataset.state = next;
    wave.classList.toggle("is-active", next === "listening" || next === "speaking");
  };

  /* ---------- speech out ---------- */
  const stopSpeech = () => {
    synth?.cancel();
    if (status === "speaking") setStatus(muted ? "muted" : "idle");
  };

  const speak = (text: string) => {
    if (!synth || muted) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = 1;
    utter.pitch = 1.04;
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus(muted ? "muted" : "idle");
    utter.onerror = () => setStatus(muted ? "muted" : "idle");
    synth.speak(utter);
  };

  /* ---------- speech in ---------- */
  const SpeechRecognitionCtor: (new () => any) | undefined =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  let recognition: any = null;
  if (SpeechRecognitionCtor) {
    try {
      recognition = new SpeechRecognitionCtor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        setStatus("idle");
        if (transcript) {
          input.value = transcript;
          handleQuestion(transcript);
        }
      };
      recognition.onerror = () => setStatus(muted ? "muted" : "idle");
      recognition.onend = () => { if (status === "listening") setStatus(muted ? "muted" : "idle"); };
    } catch {
      recognition = null;
    }
  }
  if (!recognition) {
    micBtn.disabled = true;
    micBtn.title = "Voice input is not supported in this browser";
    micBtn.setAttribute("aria-disabled", "true");
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) return;
    stopSpeech();
    try {
      if (status === "listening") {
        recognition.stop();
        setStatus(muted ? "muted" : "idle");
      } else {
        recognition.start();
        setStatus("listening");
      }
    } catch { setStatus(muted ? "muted" : "idle"); }
  });

  /* ---------- matching ---------- */
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s/&'-]/g, " ").replace(/\s+/g, " ").trim();
  const match = (question: string): string => {
    const q = ` ${normalize(question)} `;
    let best: { score: number; answer: string } = { score: 0, answer: assistantConfig.fallback };
    for (const intent of intents) {
      let score = 0;
      for (const kw of intent.keywords) {
        if (q.includes(` ${kw} `) || q.includes(`${kw} `) || q.includes(` ${kw}`) || q.trim() === kw) {
          score += kw.split(" ").length * 2 + kw.length * 0.05;
        }
      }
      if (score > best.score) best = { score, answer: intent.answer };
    }
    return best.answer;
  };

  /* ---------- messages ---------- */
  const addMessage = (role: "user" | "bot", text: string, withActions = false): HTMLElement => {
    const item = document.createElement("div");
    item.className = `assistant-msg is-${role}`;
    const bubble = document.createElement("div");
    bubble.className = "assistant-bubble";
    item.appendChild(bubble);
    if (withActions && synth) {
      const actions = document.createElement("div");
      actions.className = "assistant-msg-actions";
      const speakBtn = document.createElement("button");
      speakBtn.type = "button";
      speakBtn.className = "assistant-mini-btn";
      speakBtn.textContent = "Speak answer";
      speakBtn.setAttribute("aria-label", "Speak this answer aloud");
      speakBtn.addEventListener("click", () => { muted = false; updateMuteUI(); speak(text); });
      actions.appendChild(speakBtn);
      item.appendChild(actions);
    }
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    if (role === "user" || reducedMotion) {
      bubble.textContent = text;
    } else {
      /* typing animation */
      bubble.textContent = "";
      let i = 0;
      window.clearInterval(typingTimer);
      typingTimer = window.setInterval(() => {
        i += 3;
        bubble.textContent = text.slice(0, i);
        log.scrollTop = log.scrollHeight;
        if (i >= text.length) window.clearInterval(typingTimer);
      }, 14);
    }
    return item;
  };

  const handleQuestion = (question: string) => {
    const text = question.trim();
    if (!text) return;
    addMessage("user", text);
    input.value = "";
    setStatus("thinking");
    const typing = document.createElement("div");
    typing.className = "assistant-msg is-bot assistant-typing";
    typing.innerHTML = "<div class='assistant-bubble'><i></i><i></i><i></i></div>";
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    window.setTimeout(() => {
      typing.remove();
      const answer = match(text);
      addMessage("bot", answer, true);
      setStatus(muted ? "muted" : "idle");
      if (voiceOn && !muted) speak(answer);
    }, reducedMotion ? 80 : 650);
  };

  /* ---------- open / close ---------- */
  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    orb.setAttribute("aria-expanded", String(next));
    panel.setAttribute("aria-hidden", String(!next));
    document.body.classList.toggle("assistant-open", next);
    if (next) {
      panel.style.visibility = "visible";
      if (reducedMotion) {
        panel.style.opacity = "1";
        panel.style.transform = "none";
      } else {
        gsap.fromTo(panel, { opacity: 0, y: 26, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" });
        gsap.fromTo(panel.querySelectorAll(".assistant-chip, .assistant-head, .assistant-msg"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.35, ease: "power2.out", delay: 0.08 });
      }
      if (!greeted) {
        greeted = true;
        addMessage("bot", assistantConfig.greeting, true);
      }
      window.setTimeout(() => input.focus(), 120);
    } else {
      stopSpeech();
      try { recognition?.stop(); } catch { /* noop */ }
      setStatus(muted ? "muted" : "idle");
      const finish = () => { panel.style.visibility = "hidden"; };
      if (reducedMotion) {
        panel.style.opacity = "0";
        finish();
      } else {
        gsap.to(panel, { opacity: 0, y: 20, scale: 0.985, duration: 0.28, ease: "power2.in", onComplete: finish });
      }
      orb.focus();
    }
  };

  orb.addEventListener("click", () => setOpen(!open));
  closeBtn.addEventListener("click", () => setOpen(false));
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
  window.addEventListener("keydown", onKey);

  /* ---------- controls ---------- */
  const updateMuteUI = () => {
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.title = muted ? "Unmute voice" : "Mute voice";
    muteBtn.classList.toggle("is-on", muted);
    if (muted) { stopSpeech(); setStatus("muted"); }
    else if (status === "muted") setStatus("idle");
  };
  muteBtn.addEventListener("click", () => { muted = !muted; updateMuteUI(); });

  voiceToggle.addEventListener("click", () => {
    voiceOn = !voiceOn;
    voiceToggle.setAttribute("aria-pressed", String(voiceOn));
    voiceToggle.classList.toggle("is-on", voiceOn);
    voiceToggle.title = voiceOn ? "Voice replies on" : "Voice replies off";
    if (voiceOn) { muted = false; updateMuteUI(); }
    else stopSpeech();
  });

  stopBtn.addEventListener("click", stopSpeech);

  if (!synth) {
    [voiceToggle, muteBtn, stopBtn].forEach((b) => {
      b.disabled = true;
      b.title = "Speech is not supported in this browser";
    });
  }

  /* ---------- quick questions ---------- */
  quickQuestions.forEach((q) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "assistant-chip";
    chip.textContent = q;
    chip.addEventListener("click", () => handleQuestion(q));
    chips.appendChild(chip);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleQuestion(input.value);
  });

  /* ---------- lifecycle safety ---------- */
  window.addEventListener("pagehide", () => {
    stopSpeech();
    try { recognition?.abort?.(); } catch { /* noop */ }
    window.removeEventListener("keydown", onKey);
    window.clearInterval(typingTimer);
  }, { once: true });

  setStatus("idle");
}
