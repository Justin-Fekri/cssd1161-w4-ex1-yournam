// Screening-question answering. Two kinds of questions show up on applications:
//
//   Knockout questions  - work authorization, sponsorship, relocation, salary.
//     These are hard filters. A wrong answer auto-rejects before a human looks,
//     so they are answered strictly from the profile, never guessed.
//   Free-text questions - "why this company", "describe a project".
//     Drafted from the profile plus the posting, and always marked for review.

import { mentions } from './keywords.js';

const KNOCKOUT = [
  { id: 'authorized', match: /legally (authorized|entitled|eligible)|authorized to work|right to work|eligible to work/i, from: (p) => p.workAuthorization?.authorizedToWork },
  { id: 'sponsorship', match: /sponsor|visa|work permit|immigration/i, from: (p) => p.workAuthorization?.requireSponsorship },
  { id: 'relocate', match: /relocat/i, from: (p) => p.workAuthorization?.willingToRelocate },
  { id: 'remote', match: /remote|hybrid|on-?site|in office|commute/i, from: (p) => p.workAuthorization?.remotePreference },
  { id: 'start', match: /start date|available|notice period|when can you/i, from: (p) => p.workAuthorization?.noticePeriod },
  { id: 'salary', match: /salary|compensation expectation|expected pay|desired pay|rate/i, from: (p) => p.workAuthorization?.desiredSalary },
  { id: 'age', match: /18 years|age of majority|legal working age/i, from: () => 'Yes' },
  { id: 'background', match: /background check|criminal/i, from: () => 'Yes' },
  { id: 'referral', match: /how did you (hear|find)|referral source/i, from: (p) => p.answers?.howDidYouHear || 'Company careers page' },
  { id: 'gender', match: /\bgender\b/i, from: (p) => p.demographics?.gender },
  { id: 'race', match: /race|ethnicit/i, from: (p) => p.demographics?.raceEthnicity },
  { id: 'veteran', match: /veteran/i, from: (p) => p.demographics?.veteranStatus },
  { id: 'disability', match: /disabilit/i, from: (p) => p.demographics?.disabilityStatus },
];

/** Answer a single question label from the profile. Returns null if unknown. */
export function answerQuestion(label, profile, ctx = {}) {
  for (const k of KNOCKOUT) {
    if (k.match.test(label)) {
      const val = k.from(profile);
      if (val) return { answer: String(val), source: 'profile', confident: true, id: k.id };
    }
  }
  const drafted = draftFreeText(label, profile, ctx);
  if (drafted) return { answer: drafted, source: 'drafted', confident: false, id: 'freetext' };
  return null;
}

function draftFreeText(label, profile, { job, tailored, analysis } = {}) {
  const l = label.toLowerCase();
  const company = job?.company && job.company !== 'Unknown' ? job.company : 'your team';
  const title = (job?.title || '').split(/\s[-|–]\s/)[0].trim();
  const top = (tailored?.match?.covered || []).slice(0, 3);

  if (/why (do you want to work|are you interested in|this company|us\b)/.test(l)) {
    return profile.answers?.whyThisCompany
      || `The ${title || 'role'} at ${company} lines up directly with the work I have been doing in ${top.join(', ') || 'software development'}. I am looking for a team where I can keep building on that and take on more ownership, and this posting describes exactly that kind of scope.`;
  }
  if (/why (this|the) (role|position)|why should we hire/.test(l)) {
    const b = bestBullet(tailored);
    return profile.answers?.whyThisRole
      || `Your posting emphasizes ${top.join(', ') || 'these skills'}, which is where my experience is concentrated.${b ? ` For example: ${b}` : ''} I would bring that directly into this role from day one.`;
  }
  if (/(describe|tell us about).*(project|accomplishment|achievement)|proudest|most challenging/.test(l)) {
    const b = bestBullet(tailored);
    return profile.answers?.notableProject || b || '';
  }
  if (/strength/.test(l)) {
    return profile.answers?.greatestStrength
      || `Turning an ambiguous requirement into something shipped and tested. ${bestBullet(tailored) || ''}`.trim();
  }
  if (/cover letter/.test(l)) return '__COVER_LETTER__';
  return null;
}

function bestBullet(tailored) {
  if (!tailored) return '';
  const all = [...(tailored.experience || []).flatMap((e) => e.bullets), ...(tailored.projects || []).flatMap((p) => p.bullets)];
  const ranked = all.sort((a, b) => (b.score || 0) - (a.score || 0));
  return ranked[0]?.text || '';
}

/**
 * Build the standard answer pack for a job: the fields nearly every application
 * asks for, pre-resolved, so autofill and manual entry both have one source.
 */
export function buildAnswerPack(profile, job, tailored, analysis) {
  const std = [
    'First name', 'Last name', 'Email', 'Phone', 'Location (City)',
    'LinkedIn Profile', 'GitHub', 'Portfolio / Website',
    'Are you legally authorized to work in this country?',
    'Will you now or in the future require sponsorship?',
    'Are you willing to relocate?',
    'What is your remote work preference?',
    'When can you start / notice period?',
    'What are your salary expectations?',
    'How did you hear about this role?',
    'Why do you want to work here?',
    'Why are you interested in this role?',
    'Describe a project you are proud of.',
  ];

  const [first, ...restName] = String(profile.name || '').split(' ');
  const direct = {
    'First name': first || '',
    'Last name': restName.join(' '),
    'Email': profile.email || '',
    'Phone': profile.phone || '',
    'Location (City)': profile.location || '',
    'LinkedIn Profile': profile.links?.linkedin || '',
    'GitHub': profile.links?.github || '',
    'Portfolio / Website': profile.links?.portfolio || '',
  };

  return std.map((q) => {
    if (q in direct) {
      return { question: q, answer: direct[q], source: 'profile', confident: true, needsReview: !direct[q] };
    }
    const a = answerQuestion(q, profile, { job, tailored, analysis });
    return {
      question: q,
      answer: a?.answer || '',
      source: a?.source || 'none',
      confident: !!a?.confident,
      needsReview: !a || !a.confident,
    };
  });
}

export { KNOCKOUT };
