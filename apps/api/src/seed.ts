import { SERVICE_DISCLAIMER, slugify } from '@tmsampark/shared';
import { connectDb, disconnectDb } from './config/db.js';
import { BlogCategory, BlogPost, FAQ, Service, ServiceCategory, ServicePackage } from './models/index.js';
import { POLICY_TEMPLATES } from './services/settings.service.js';
import { getSettings } from './services/settings.service.js';
import { readingTimeMinutes } from '@tmsampark/shared';

const disclaimer = SERVICE_DISCLAIMER;

type SeedService = {
  category: string;
  name: string;
  summary: string;
  overview: string;
  documents: string[];
  timeline: string;
  fee: number;
  featured?: boolean;
};

const categories = [
  ['Company Registration', 'Structures such as private limited companies, LLPs, and one person companies.'],
  ['GST Registration and Returns', 'GST registration and periodic return preparation. Thresholds are set by GST law and change.'],
  ['Trademark Registration', 'Applications filed with the trademark office. Registration is not instant.'],
  ['FSSAI Registration and Licensing', 'Food business registration and licensing. The correct form depends on activity and scale.'],
  ['MSME/Udyam Registration', 'Optional assistance for Udyam. The government portal itself does not charge a professional fee.'],
  ['Import Export Code', 'IEC applications with DGFT. One IEC is generally linked to one PAN.'],
  ['Annual Compliance', 'Routine company filings after incorporation. Due dates depend on the financial year and the form.'],
  ['Accounting and Taxation', 'Bookkeeping support and tax-filing preparation. This is not a substitute for a statutory audit unless agreed.'],
  ['Business Licenses', 'Help identifying and preparing local or sector licences. The licence itself is issued by the authority.'],
  ['Legal Documentation', 'Drafting support for business documents you review before signing.'],
];

const services: SeedService[] = [
  {
    category: 'Company Registration',
    name: 'Private Limited Company Registration',
    featured: true,
    summary: 'Prepare a private limited company application for MCA filing after you approve the documents.',
    overview:
      'A private limited company is a separate legal entity commonly used when founders want limited liability and the ability to issue shares. TMSAMPARK prepares the incorporation paperwork and files it only after you review and authorise the submission. At least two directors and two shareholders are commonly required, and at least one director must be resident in India. Confirm the current Companies Act and MCA checklist before you apply.',
    documents: ['PAN of directors and shareholders', 'Address proof', 'Registered office proof', 'Photographs', 'Proposed name options'],
    timeline: 'Often a few working days after name approval and a complete document set. MCA processing is outside our control.',
    fee: 699900,
  },
  {
    category: 'Company Registration',
    name: 'Limited Liability Partnership Registration',
    summary: 'Prepare an LLP incorporation application for two or more partners.',
    overview:
      'An LLP combines a partnership structure with limited liability. At least two partners are required, and at least one designated partner must be resident in India. We prepare Form FiLLiP and related consents. Stamp duty and MCA fees are separate.',
    documents: ['PAN and address proof of partners', 'Registered office proof', 'Partner consent'],
    timeline: 'Depends on name reservation and document completeness.',
    fee: 599900,
  },
  {
    category: 'Company Registration',
    name: 'One Person Company Registration',
    featured: true,
    summary: 'Prepare an OPC application, including the nominee details the law requires.',
    overview:
      'An OPC lets a single shareholder incorporate a company, with a nominee who takes over if the member is unable to continue. Eligibility limits on turnover and capital apply and should be checked against the current rules.',
    documents: ['PAN and address proof', 'Nominee consent', 'Registered office proof'],
    timeline: 'Similar to a private limited filing once documents and the nominee consent are ready.',
    fee: 649900,
  },
  {
    category: 'GST Registration and Returns',
    name: 'GST Registration',
    featured: true,
    summary: 'Prepare a GST registration application when your activity requires it.',
    overview:
      'GST registration is required in specific cases, including when turnover crosses the notified threshold or when you are required to register regardless of turnover. Do not rely on an old threshold printed on a website. We collect the details the GST portal asks for and file after you approve them.',
    documents: ['PAN', 'Business address proof', 'Bank proof', 'Authorised signatory details'],
    timeline: 'Portal processing commonly follows a complete application, and clarification notices can extend it.',
    fee: 199900,
  },
  {
    category: 'GST Registration and Returns',
    name: 'GST Return Preparation',
    summary: 'Prepare periodic GST returns from the sales and purchase data you provide.',
    overview:
      'Return preparation is separate from registration. We reconcile the figures you share and prepare the return for your approval. Late fees and interest, if any, are levied by the tax department and are not part of the professional fee.',
    documents: ['Sales register', 'Purchase register', 'GST login authorisation'],
    timeline: 'Depends on how quickly books are shared before the statutory due date.',
    fee: 149900,
  },
  {
    category: 'Trademark Registration',
    name: 'Trademark Application',
    featured: true,
    summary: 'Prepare a trademark application in the classes you choose.',
    overview:
      'A trademark application is filed with the Controller General of Patents, Designs and Trade Marks. Examination, publication, and opposition can take many months. A filing receipt is not a registration certificate. Government fees depend on the number of classes and the applicant type.',
    documents: ['Applicant identity and address proof', 'Brand representation', 'Authorisation'],
    timeline: 'Filing can be prepared in days. Registration, if granted, takes much longer.',
    fee: 249900,
  },
  {
    category: 'FSSAI Registration and Licensing',
    name: 'FSSAI Basic Registration Assistance',
    summary: 'Help a small food business choose and prepare the correct FSSAI form.',
    overview:
      'Food businesses need a registration or a state or central licence depending on activity and scale. Basic registration is only appropriate below the notified limit. We will not file a basic registration if the facts you share point to a licence instead.',
    documents: ['Identity and address proof', 'Food business photos or layout where asked', 'Partner or director list'],
    timeline: 'Depends on the form and any inspection the authority requires.',
    fee: 149900,
  },
  {
    category: 'MSME/Udyam Registration',
    name: 'Udyam Registration Assistance',
    summary: 'Optional help preparing an Udyam registration. The government portal does not charge a filing fee.',
    overview:
      'Udyam registration is completed on the official portal and is free of government filing fee. Our professional fee is only for collecting information and filing on your instruction. You can file it yourself. Classification depends on investment and turnover as notified.',
    documents: ['Aadhaar of the authorised person', 'PAN and GST details if already available'],
    timeline: 'Often the same day when the portal is available and details match.',
    fee: 49900,
  },
  {
    category: 'Import Export Code',
    name: 'Import Export Code Application',
    featured: true,
    summary: 'Prepare an IEC application with DGFT for a business that will import or export.',
    overview:
      'An Importer Exporter Code is issued by DGFT and is generally one code per PAN. Bank details and address proofs must match the application. Government fees, if notified, are extra.',
    documents: ['PAN', 'Business address proof', 'Cancelled cheque or bank proof'],
    timeline: 'Often a few working days after a consistent application is filed.',
    fee: 199900,
  },
  {
    category: 'Annual Compliance',
    name: 'Private Limited Annual Filing',
    summary: 'Prepare routine annual MCA forms for an existing private limited company.',
    overview:
      'Companies commonly file financial statements and an annual return, and they appoint or continue an auditor within the required window. The exact forms and due dates depend on the company and the financial year. Penalties for delay are imposed by the MCA, not by TMSAMPARK.',
    documents: ['Financial statements', 'Director details', 'Previous filings', 'Auditor appointment papers'],
    timeline: 'Schedule work before the statutory due date. Filing speed depends on signed financials.',
    fee: 899900,
  },
  {
    category: 'Accounting and Taxation',
    name: 'Monthly Bookkeeping',
    summary: 'Record sales, purchases, and expenses from the documents you share.',
    overview:
      'Bookkeeping keeps a running record so GST and income-tax filings have a source. This package does not include a statutory audit, representation before an authority, or a promise of a tax outcome.',
    documents: ['Invoices', 'Bank statements', 'Expense proofs'],
    timeline: 'Monthly, after you share the month’s documents.',
    fee: 299900,
  },
  {
    category: 'Business Licenses',
    name: 'Shop and Establishment Registration',
    summary: 'Prepare a shop and establishment application for the state where the workplace sits.',
    overview:
      'Most states require shops, offices, and commercial establishments to register. The form, fee, and timeline are state-specific. We prepare the application for the state you name. We do not claim a single national fee.',
    documents: ['Business address proof', 'Identity of the employer', 'Employee count'],
    timeline: 'Varies by state portal and local authority.',
    fee: 149900,
  },
  {
    category: 'Legal Documentation',
    name: 'Partnership Deed Draft',
    summary: 'Draft a partnership deed from the commercial terms you confirm.',
    overview:
      'A partnership deed records capital, profit share, roles, and exit terms. Stamp duty depends on the state and the capital. You should have the draft read before it is executed. This service drafts the document. It is not representation in a dispute.',
    documents: ['Partner identities', 'Capital and profit-sharing terms', 'Place of business'],
    timeline: 'A draft is usually shared within a few working days of a complete brief.',
    fee: 349900,
  },
];

const articles = [
  {
    title: 'What to collect before a private limited company application',
    slug: 'documents-before-company-registration',
    tags: ['company registration', 'mca'],
    excerpt: 'A practical document list for founders preparing an MCA incorporation, and what the filing still depends on.',
    content: `This note is general information from the TMSAMPARK editorial desk. It is not legal advice.

Founders usually lose time on three items: a registered office proof that matches the application, identity documents of every director and shareholder, and a name that is not already too close to an existing company or trademark.

Ask each director for PAN, address proof, and a clear photograph. Decide who will be the resident director. Write down the authorised capital and the first share split before anyone starts the form.

TMSAMPARK can prepare the application after you approve those facts. The Ministry of Corporate Affairs still examines the filing, and a name rejection or a defective address proof will pause it.

If you only need a rough sequence, start with the name, then the office proof, then director identification, and only then the paid forms.`,
  },
  {
    title: 'GST registration is not the same as a GST return',
    slug: 'gst-registration-versus-returns',
    tags: ['gst', 'returns'],
    excerpt: 'Registration gets a GSTIN. Returns report tax after that. They are separate pieces of work.',
    content: `This note is general information, not tax advice.

GST registration is the application for a GSTIN. A return is the later statement of outward supplies, inward supplies, and tax. A business can need one, the other, or both.

Thresholds and compulsory cases are notified by the government and should be checked on the GST portal or with a tax adviser before you pay anyone to file. A professional fee quote should say whether it covers registration only, a single return, or a month of bookkeeping.

Interest and late fees, if they apply, are charged by the department. They are not a hidden line inside a professional fee unless your quote says so.`,
  },
  {
    title: 'How to read a trademark filing quote',
    slug: 'how-to-read-a-trademark-quote',
    tags: ['trademark', 'pricing'],
    excerpt: 'Separate the professional fee, the government fee per class, and the months of examination that follow a filing receipt.',
    content: `This note is general information, not a prediction of whether a mark will be registered.

A careful quote separates three things. The professional fee is for search support, the draft application, and filing after you approve it. The government fee depends on the number of classes and who the applicant is. Anything after examination, including a reply to an objection or an opposition, is usually a separate scope.

A filing acknowledgement is not a registration certificate. Examination and publication take time, and the office can refuse the mark.

Ask the provider which classes are included and whether a reply to an examination report is inside the same fee.`,
  },
];

async function main() {
  await connectDb();
  const settings = await getSettings();
  if (!settings.policies?.privacy) {
    settings.policies = { ...POLICY_TEMPLATES, legallyReviewed: false };
    await settings.save();
  }

  const categoryIds = new Map<string, string>();
  for (const [index, [name, summary]] of categories.entries()) {
    const slug = slugify(name);
    const category = await ServiceCategory.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          name,
          slug,
          summary,
          description: `${summary} ${disclaimer}`,
          sortOrder: index,
          status: 'published',
          seo: {
            title: `${name} assistance`,
            description: summary,
            index: true,
          },
        },
      },
      { upsert: true, new: true },
    );
    categoryIds.set(name, String(category._id));
  }

  for (const item of services) {
    const slug = slugify(item.name);
    const exists = await Service.findOne({ slug });
    if (exists) continue;
    const service = await Service.create({
      categoryId: categoryIds.get(item.category),
      name: item.name,
      slug,
      summary: item.summary,
      overview: `${item.overview}\n\n${disclaimer}`,
      whoNeeds: ['People who want the application prepared and tracked', 'Businesses that have the source documents ready'],
      benefits: ['A written scope before filing', 'A document checklist', 'A status you can track after an order is opened'],
      eligibility: ['Confirm the current statutory test for this filing. Eligibility on this page is a starting point, not a determination.'],
      requirements: ['Accurate identity and address details', 'Authority to submit the application'],
      documents: item.documents.map((name) => ({ name, description: 'Commonly requested. The authority may ask for more.', mandatory: true })),
      process: [
        { title: 'Share the facts', description: 'Tell us the business details and the outcome you want.' },
        { title: 'Confirm the quote', description: 'Professional fees, taxes, and known government charges are listed separately.' },
        { title: 'Review the draft', description: 'Nothing is filed until you approve the application.' },
        { title: 'Track the authority', description: 'We record status changes that are visible in your account.' },
      ],
      deliverables: ['Copy of the application we prepared', 'Acknowledgement when the authority issues one', 'Status updates on the application'],
      timeline: { estimate: item.timeline, dependencies: ['Complete documents', 'Authority processing time', 'Your approval to file'] },
      faqs: [
        { question: `Is the ${item.name.toLowerCase()} fee the government fee?`, answer: 'No. The sample professional fee is for TMSAMPARK’s work. Government fees, stamp duty, and GST are extra unless a package says otherwise. Sample fees are for demonstration until you replace them.' },
        { question: 'Do you file without my approval?', answer: 'No. Filing happens only after you review and authorise it.' },
      ],
      relatedSlugs: [],
      seo: {
        title: `${item.name} assistance`,
        description: item.summary,
        index: true,
      },
      status: 'published',
      featured: Boolean(item.featured),
      disclaimer,
      feeIsSample: true,
    });
    await ServicePackage.create({
      serviceId: service._id,
      name: 'Preparation',
      description: 'Sample professional fee for preparing and filing this application after your approval.',
      professionalFeePaise: item.fee,
      governmentFeePaise: 0,
      governmentFeeNote: 'Government fees, stamp duty, and portal charges are extra and are collected at the rate notified at the time of filing.',
      included: ['Document checklist', 'Application preparation', 'Filing after written approval', 'Status updates'],
      excluded: ['Government fees', 'Stamp duty', 'Penalties or late fees', 'Work outside the written scope'],
      highlighted: true,
      feeIsSample: true,
    });
  }

  const guide = await BlogCategory.findOneAndUpdate(
    { slug: 'guides' },
    { $setOnInsert: { name: 'Guides', slug: 'guides' } },
    { upsert: true, new: true },
  );
  for (const article of articles) {
    const exists = await BlogPost.findOne({ slug: article.slug });
    if (exists) continue;
    await BlogPost.create({
      ...article,
      categoryId: guide._id,
      authorName: 'TMSAMPARK Editorial',
      authorRole: 'Editorial',
      status: 'published',
      publishedAt: new Date(),
      readingTimeMinutes: readingTimeMinutes(article.content),
      seo: { title: article.title, description: article.excerpt, index: true },
    });
  }

  const faqs = [
    ['Is TMSAMPARK a government website?', 'No. TMSAMPARK is a private services firm. Applications are filed with the relevant authority only after you approve them.'],
    ['Are the prices on a new installation final?', 'Sample professional fees are loaded so the catalogue can be reviewed. Replace them with your live fee schedule before accepting payment.'],
    ['When does an enquiry become an application?', 'An enquiry is a request for contact. An application is opened when an order is created for a customer and a reference number is issued.'],
    ['Can I track an application without an account?', 'Yes. Use the reference number and the email on the order. The page shows status only. It does not show documents.'],
    ['Do you store card numbers?', 'No. Card data stays with the payment provider. TMSAMPARK stores the payment reference, amount, and status after verification.'],
  ];
  if ((await FAQ.countDocuments()) === 0) {
    await FAQ.insertMany(
      faqs.map(([question, answer], sortOrder) => ({ question, answer, sortOrder, placement: 'both', status: 'published', category: 'General' })),
    );
  }

  console.log('Seed complete. Sample services are marked feeIsSample. No testimonials or metrics were invented.');
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb();
  process.exit(1);
});
