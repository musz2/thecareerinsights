import lifeSciences from "../assets/images/site/industry-life-sciences.webp";
import financialServices from "../assets/images/site/industry-financial-services.webp";
import technology from "../assets/images/site/industry-technology.webp";
import energy from "../assets/images/site/industry-energy.webp";
import consumerGoods from "../assets/images/site/industry-consumer-goods.webp";
import media from "../assets/images/site/industry-media.webp";
import hospitality from "../assets/images/site/industry-hospitality.webp";
import insightSpeed from "../assets/images/site/insight-speed.webp";
import insightQuality from "../assets/images/site/insight-quality.webp";
import insightSavings from "../assets/images/site/insight-savings.webp";
import insightBrand from "../assets/images/site/insight-brand.webp";
import insightIntelligence from "../assets/images/site/insight-intelligence.webp";
import regionAmericas from "../assets/images/site/region-americas.png";
import regionEmea from "../assets/images/site/region-emea.png";
import regionApac from "../assets/images/site/region-apac.png";
import awardRpo from "../assets/images/site/award-bakers-dozen-rpo.png";
import awardRpoApac from "../assets/images/site/award-bakers-dozen-rpo-apac.webp";
import { contactInfo } from "./site";

export const featuredIndustries = [
  { title: "Life Sciences", image: lifeSciences, wide: true, copy: "Finding, attracting, and retaining talent in pharma, medical devices, and life sciences is more complex — and more critical — than ever." },
  { title: "Financial Services", image: financialServices, wide: false, copy: "Specialist talent for banking, insurance, compliance, analytics, and high-trust customer operations." },
  { title: "Technology", image: technology, wide: false, copy: "Cloud, data, application, cybersecurity, DevOps, and product teams ready for modern delivery." },
  { title: "Energy + Renewables", image: energy, wide: false, copy: "Skilled professionals for utilities, renewable energy, grid modernization, and field operations." },
  { title: "Consumer Goods", image: consumerGoods, wide: false, copy: "In fast-moving consumer goods, success depends on speed, agility, and a close connection to the brand." },
  { title: "Media + Entertainment", image: media, wide: false, copy: "Creative, technology, production, and audience-growth talent for modern media teams." },
  { title: "Hospitality + Customer Operations", image: hospitality, wide: true, copy: "Front-of-house, call centre, and customer operations talent for service-led businesses." }
];

export const insights = [
  { title: "Speed to hire", image: insightSpeed, copy: "Pre-vetted shortlists from a 50,000+ professional database shorten the path from requisition to start date." },
  { title: "Candidate quality", image: insightQuality, copy: "Skills, certifications, and clearances are verified before a candidate ever reaches your team." },
  { title: "Cost control", image: insightSavings, copy: "Flexible contracts, pricing, and payment terms, with vendor consolidation that removes waste." },
  { title: "Employer brand", image: insightBrand, copy: "A consistent, respectful candidate experience that reflects well on your organization." },
  { title: "Workforce intelligence", image: insightIntelligence, copy: "Market data and hiring analytics that inform sourcing, pay, and workforce planning." }
];

export const regions = [
  {
    id: "americas",
    label: "Americas",
    image: regionAmericas,
    title: "Headquartered in the United States.",
    copy: "Our Delaware headquarters leads U.S. staffing, direct hire, contingent recruiting, and cleared-talent programs for public, private, and commercial clients.",
    details: [
      { term: "Office", value: `${contactInfo.usAddress[0]}, ${contactInfo.usAddress[1]}` },
      { term: "Focus", value: "IT staffing, public sector, cleared and veteran talent" }
    ]
  },
  {
    id: "emea",
    label: "EMEA",
    image: regionEmea,
    title: "Global sourcing, delivered remotely.",
    copy: "Our U.S. and India teams source specialist technology and professional talent for organizations hiring across Europe, the Middle East, and Africa.",
    details: [
      { term: "Delivery", value: "Remote, from our U.S. and India teams" },
      { term: "Focus", value: "Technology, SAP, cloud, and cybersecurity specialists" }
    ]
  },
  {
    id: "apac",
    label: "APAC",
    image: regionApac,
    title: "Delivery and training from Hyderabad.",
    copy: "Our India team supports sourcing, technical delivery, corporate training, and campus programs across India and the wider Asia-Pacific region.",
    details: [
      { term: "Office", value: `${contactInfo.indiaAddress[0]}, ${contactInfo.indiaAddress[1]}` },
      { term: "Focus", value: "Delivery, technical training, university programs" }
    ]
  }
];

/* Recognition banner. These badges are HRO Today Baker's Dozen 2025 RPO
   ratings. Keep `enabled: false` until TCI's own win is confirmed —
   publishing another firm's award as TCI's would be a false claim. */
export const awards = {
  enabled: false,
  items: [
    { image: awardRpo, alt: "HRO Today Baker's Dozen Customer Satisfaction Ratings — RPO", caption: "HRO Today Baker's Dozen 2025 — RPO" },
    { image: awardRpoApac, alt: "HRO Today Baker's Dozen 2025 — Top RPO Provider in APAC", caption: "Top RPO Provider in APAC 2025" }
  ]
};
