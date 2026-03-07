import formFields from './form-fields.json' assert { type: 'json' };

const p = formFields.PERSONAL_DETAILS;
const addr = p.ADDRESS;
const login = p.LOGIN;

const snippets = {
  // Personal
  ss: `${p.FIRST_NAME} ${p.LAST_NAME}`,
  sa: p.FIRST_NAME,
  sm: 'Somasunder',
  sh: 'Shreenidark@1990',
  Zx: login.SECONDARY_PASSWORD,
  cv: 'Cvfd1880@',
  zat: login.USERNAME,
  em: p.EMAIL,
  ln: p.LINKEDIN,
  ll: formFields.APPLICATION_FIELDS.LINKEDIN_LABEL,
  '97': p.PHONE_NUMBER,

  // Address
  '16': addr.FIRST_LINE,
  '21': addr.ZIP,
  md: addr.STATE,
  ba: addr.CITY,
  us: addr.COUNTRY,

  // Education
  njit: formFields.COLLEGES.MASTERS.NAME,
  srm: formFields.COLLEGES.BACHELORS.NAME,
  cs: formFields.COLLEGES.MASTERS.MAJOR,
  ee: formFields.COLLEGES.BACHELORS.MAJOR,

  // Companies
  am: formFields.EXPERIENCES.AMERIPRISE.COMPANY,
  nm: formFields.EXPERIENCES.NORTHWESTERN.COMPANY,
  ae: 'Aekya Inc',
  en: 'Envogue',

  // Job / application
  sse: formFields.JOB_TITLES.SENIOR,
  se: formFields.JOB_TITLES.DEFAULT,
  ng: formFields.APPLICATION_FIELDS.SALARY_TYPE,
  rl: formFields.APPLICATION_FIELDS.RELOCATION,
  h1: formFields.APPLICATION_FIELDS.IMMIGRATION_STATUS,
  '12': formFields.APPLICATION_FIELDS.EXPECTED_SALARY,
  '96': formFields.RATES.YEARLY,
  '48': formFields.RATES.HOURLY,
  im: formFields.AVAILABILITY.IMMEDIATELY,
  na: formFields.AVAILABILITY.NA,

  // Long text
  nje: 'Developed a data visualization tree using ReactJS, NodeJS, Docker, Kubernetes, and d3.js for intuitive exploration of multidimensional data. Implemented parallel computing using Python, Numpy, and CUDA, \nEngineered a multi-agent reinforced learning model simulating naval ships and integrated deep learning models on TensorFlow. \nDeveloped Convolutional Neural Networks (CNN), Recurrent Neural Networks (RNN), Natural Language Processing (NLP), Optical Character Recognition (OCR), and Segmentation models on TensorFlow, Keras, and PyTorch, leveraging CUDA for enhanced computational efficiency.',
  are: '• Developed a data visualization tree using ReactJS, NodeJS, Docker, Kubernetes, and d3.js for intuitive exploration of multidimensional data. Implemented parallel computing using Python, Numpy, and CUDA, \n• Engineered a multi-agent reinforced learning model simulating naval ships and integrated deep learning models on TensorFlow. \n• Developed Convolutional Neural Networks (CNN), Recurrent Natural Networks (RNN), Natural Language Processing (NLP), Optical Character Recognition (OCR), and Segmentation models on TensorFlow, Keras, and PyTorch, leveraging CUDA for enhanced computational efficiency.',
  txt: formFields.DM_TEMPLATES.SHORT,
  cte: formFields.DM_TEMPLATES.LONG,
};

export default snippets;
