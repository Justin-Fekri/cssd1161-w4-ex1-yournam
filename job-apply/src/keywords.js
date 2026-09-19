// Keyword extraction and weighting for job descriptions.
// Weighting matters more than raw matching: a term in the requirements block
// is worth far more to an ATS-era recruiter than one in the perks section.

// Canonical skill -> aliases that should all count as the same hit.
export const SKILLS = {
  'JavaScript': ['javascript', 'js', 'es6', 'ecmascript'],
  'TypeScript': ['typescript', 'ts'],
  'Python': ['python', 'python3'],
  'Java': ['java'],
  'C#': ['c#', 'csharp', 'c sharp', '.net', 'dotnet'],
  'C++': ['c++', 'cpp'],
  'C': ['c language'],
  'Go': ['golang', 'go lang'],
  'Rust': ['rust'],
  'PHP': ['php'],
  'Ruby': ['ruby', 'ruby on rails', 'rails'],
  'Swift': ['swift'],
  'Kotlin': ['kotlin'],
  'SQL': ['sql', 'tsql', 't-sql', 'plsql', 'pl/sql'],
  'HTML': ['html', 'html5'],
  'CSS': ['css', 'css3', 'sass', 'scss', 'less'],
  'React': ['react', 'react.js', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Angular': ['angular', 'angularjs'],
  'Vue': ['vue', 'vue.js', 'vuejs'],
  'Node.js': ['node', 'node.js', 'nodejs'],
  'Express': ['express', 'express.js', 'expressjs'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring Boot': ['spring', 'spring boot', 'springboot'],
  'ASP.NET': ['asp.net', 'aspnet'],
  'REST APIs': ['rest', 'restful', 'rest api', 'rest apis', 'api design'],
  'GraphQL': ['graphql'],
  'gRPC': ['grpc'],
  'Microservices': ['microservice', 'microservices'],
  'PostgreSQL': ['postgres', 'postgresql'],
  'MySQL': ['mysql', 'mariadb'],
  'SQL Server': ['sql server', 'mssql'],
  'Oracle': ['oracle db', 'oracle database'],
  'MongoDB': ['mongodb', 'mongo'],
  'Redis': ['redis'],
  'DynamoDB': ['dynamodb'],
  'Elasticsearch': ['elasticsearch', 'opensearch'],
  'Kafka': ['kafka'],
  'RabbitMQ': ['rabbitmq'],
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  'Azure': ['azure', 'microsoft azure'],
  'GCP': ['gcp', 'google cloud'],
  'Docker': ['docker', 'containerization', 'containers'],
  'Kubernetes': ['kubernetes', 'k8s', 'eks', 'aks', 'gke'],
  'Terraform': ['terraform', 'infrastructure as code', 'iac'],
  'Ansible': ['ansible'],
  'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  'Jenkins': ['jenkins'],
  'GitHub Actions': ['github actions'],
  'GitLab CI': ['gitlab ci', 'gitlab-ci'],
  'Git': ['git', 'version control', 'github', 'gitlab', 'bitbucket'],
  'Linux': ['linux', 'unix', 'bash', 'shell scripting'],
  'Agile': ['agile', 'scrum', 'kanban', 'sprint'],
  'Jira': ['jira', 'confluence'],
  'Unit Testing': ['unit test', 'unit testing', 'jest', 'pytest', 'junit', 'mocha', 'vitest', 'nunit', 'xunit'],
  'Test Automation': ['test automation', 'automated testing', 'selenium', 'cypress', 'playwright', 'qa automation'],
  'TDD': ['tdd', 'test driven', 'test-driven'],
  'Debugging': ['debugging', 'troubleshooting', 'root cause'],
  'Code Review': ['code review', 'peer review', 'pull request'],
  'System Design': ['system design', 'architecture', 'scalability', 'distributed systems'],
  'Data Structures': ['data structures', 'algorithms', 'big o'],
  'OOP': ['oop', 'object oriented', 'object-oriented', 'solid principles', 'design patterns'],
  'Machine Learning': ['machine learning', 'ml', 'deep learning', 'neural network'],
  'Data Analysis': ['data analysis', 'data analytics', 'pandas', 'numpy'],
  'Power BI': ['power bi', 'powerbi'],
  'Tableau': ['tableau'],
  'Excel': ['excel', 'spreadsheets', 'vlookup', 'pivot table'],
  'ETL': ['etl', 'elt', 'data pipeline', 'data pipelines'],
  'Airflow': ['airflow'],
  'Spark': ['spark', 'pyspark'],
  'Cybersecurity': ['cybersecurity', 'information security', 'infosec', 'security'],
  'Networking': ['networking', 'tcp/ip', 'dns', 'vpn', 'firewall'],
  'Active Directory': ['active directory', 'ldap'],
  'Windows Server': ['windows server'],
  'Technical Support': ['technical support', 'help desk', 'helpdesk', 'service desk', 'end user support'],
  'Ticketing Systems': ['ticketing', 'servicenow', 'zendesk', 'freshdesk'],
  'ITIL': ['itil'],
  'Salesforce': ['salesforce'],
  'SAP': ['sap'],
  'Figma': ['figma', 'wireframe', 'wireframes'],
  'UI/UX': ['ui/ux', 'user experience', 'usability', 'responsive design', 'accessibility', 'wcag'],
  'Mobile Development': ['ios', 'android', 'react native', 'flutter', 'mobile app'],
  'Web Development': ['web development', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'full-stack'],
  'Communication': ['communication', 'communicate', 'stakeholder', 'presentation'],
  'Teamwork': ['teamwork', 'collaboration', 'collaborative', 'cross-functional', 'team player'],
  'Problem Solving': ['problem solving', 'problem-solving', 'analytical'],
  'Documentation': ['documentation', 'technical writing', 'runbook'],
  'Time Management': ['time management', 'prioritize', 'prioritization', 'deadlines'],
  'Customer Service': ['customer service', 'client facing', 'client-facing'],
  'Leadership': ['leadership', 'mentor', 'mentoring', 'lead a team'],
};

// Sections whose contents should be weighted up or down.
const HEAVY_HEADINGS = /(requirement|qualification|must have|what you.{0,5}ll (need|bring|do)|skills|responsibilit|about the role|who you are|experience)/i;
const LIGHT_HEADINGS = /(benefit|perk|about (us|the company)|equal opportunit|diversity|accommodat|compensation|why join|our values)/i;

const STOP = new Set(('a an the and or but if then than that this these those of in on at to for with from by as is are was were be been being will would can could should may might must have has had do does did not no you your we our us they their it its s t re ve ll d m o').split(' '));

export function normalize(text) {
  return String(text || '')
    .replace(/ /g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\r/g, '');
}

// Split the posting into blocks and assign each a weight multiplier.
function weightedBlocks(text) {
  const lines = normalize(text).split('\n');
  const blocks = [];
  let weight = 1;
  for (const line of lines) {
    const bare = line.trim();
    if (!bare) continue;
    // A short line with no sentence punctuation is probably a heading.
    const isHeading = bare.length < 70 && !/[.;]$/.test(bare);
    if (isHeading && HEAVY_HEADINGS.test(bare)) weight = 2.5;
    else if (isHeading && LIGHT_HEADINGS.test(bare)) weight = 0.35;
    blocks.push({ text: bare, weight });
  }
  return blocks;
}

function countAlias(haystack, alias) {
  // Word-boundary-ish match that survives punctuation like "C#", "Node.js", "CI/CD".
  const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9+#.])${esc}($|[^a-z0-9+#.])`, 'gi');
  let n = 0;
  while (re.exec(haystack) !== null) n++;
  return n;
}

/**
 * Extract weighted keywords from a job description.
 * Returns { keywords: [{term, weight, required, hits}], required: [...], years: [...] }
 */
export function extractKeywords(jdText, jobTitle = '') {
  const blocks = weightedBlocks(jdText);
  const lowerTitle = normalize(jobTitle).toLowerCase();
  const scores = new Map();

  for (const block of blocks) {
    const hay = block.text.toLowerCase();
    // "Required"/"must" phrasing inside the line itself bumps it further.
    const mustBump = /\b(must|required|require[sd]?|essential|minimum)\b/.test(hay) ? 1.6 : 1;
    for (const [canon, aliases] of Object.entries(SKILLS)) {
      let hits = 0;
      for (const alias of aliases) hits += countAlias(hay, alias);
      if (!hits) continue;
      const prev = scores.get(canon) || { term: canon, weight: 0, hits: 0, required: false };
      prev.weight += hits * block.weight * mustBump;
      prev.hits += hits;
      if (block.weight >= 2.5 || mustBump > 1) prev.required = true;
      scores.set(canon, prev);
    }
  }

  // A skill named in the job title is the single strongest signal there is.
  for (const [canon, aliases] of Object.entries(SKILLS)) {
    if (aliases.some((a) => countAlias(lowerTitle, a) > 0)) {
      const prev = scores.get(canon) || { term: canon, weight: 0, hits: 0, required: false };
      prev.weight += 6;
      prev.required = true;
      scores.set(canon, prev);
    }
  }

  const keywords = [...scores.values()].sort((a, b) => b.weight - a.weight);

  return {
    keywords,
    required: keywords.filter((k) => k.required).map((k) => k.term),
    years: extractYears(jdText),
    phrases: extractPhrases(jdText),
  };
}

// "3+ years of experience in X" — recruiters screen on these hard.
export function extractYears(text) {
  const out = [];
  const re = /(\d+)\s*\+?\s*(?:to\s*\d+\s*)?years?[^.\n;]{0,60}/gi;
  let m;
  while ((m = re.exec(normalize(text))) !== null) {
    out.push({ years: Number(m[1]), context: m[0].trim().replace(/\s+/g, ' ') });
  }
  return out.slice(0, 12);
}

// Recurring multi-word phrases the skill dictionary would miss (domain jargon).
export function extractPhrases(text, limit = 15) {
  const words = normalize(text).toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const counts = new Map();
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const gram = words.slice(i, i + n);
      if (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1])) continue;
      if (gram.some((w) => w.length < 3)) continue;
      const key = gram.join(' ');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

/** Does this block of text contain the given canonical skill? */
export function mentions(text, canon) {
  const aliases = SKILLS[canon] || [canon.toLowerCase()];
  const hay = normalize(text).toLowerCase();
  return aliases.some((a) => countAlias(hay, a) > 0) || countAlias(hay, canon.toLowerCase()) > 0;
}
