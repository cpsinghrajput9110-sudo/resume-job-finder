// Pre-packaged realistic sample resumes for instant 1-click testing
const sampleResumes = {
  software_engineer: {
    id: "software_engineer",
    name: "Alex Morgan - Senior Full Stack Engineer",
    preferredLocation: "San Francisco, CA",
    role: "Senior Full Stack Engineer",
    text: `ALEX MORGAN
San Francisco, CA | (555) 349-1029 | alex.morgan.dev@email.com | linkedin.com/in/alexmorgandev | github.com/alexmorgan

SUMMARY
Results-driven Senior Full Stack Software Engineer with 6+ years of experience designing, architecting, and deploying high-scale distributed web applications. Expert in TypeScript, React, Node.js, Python, PostgreSQL, and AWS cloud architecture. Proven track record of improving system latency by 42% and scaling platforms to 2M+ active users.

TECHNICAL SKILLS
- Programming Languages: TypeScript, JavaScript, Python, Go, SQL, HTML5, CSS3
- Frontend: React.js, Next.js, Redux Toolkit, Tailwind CSS, Webpack, Vite
- Backend & Microservices: Node.js, Express, FastAPI, REST APIs, GraphQL, gRPC
- Databases & Caching: PostgreSQL, MongoDB, Redis, Elasticsearch
- Cloud & DevOps: AWS (EC2, S3, ECS, Lambda), Docker, Kubernetes, Terraform, GitHub Actions, CI/CD
- Architecture & Practices: System Design, Microservices, Agile/Scrum, Test-Driven Development (TDD), Jest

PROFESSIONAL EXPERIENCE
Senior Full Stack Engineer | Apex Cloud Solutions, San Francisco, CA | 2022 - Present
- Architected and delivered a multi-tenant SaaS analytics platform handling 15M+ requests/day using Next.js, Node.js, and PostgreSQL.
- Reduced API response times by 48% across 35 microservices by implementing Redis distributed caching and query optimization.
- Spearheaded the migration from monolithic architecture to Dockerized AWS ECS containers, cutting infrastructure costs by $180,000 annually.
- Mentored a cross-functional team of 8 junior and mid-level engineers, establishing TDD practices that reduced production bug escape rate by 34%.

Full Stack Developer | NexaTech Systems, Austin, TX | 2019 - 2022
- Developed customer-facing React components with TypeScript and Tailwind CSS, increasing user onboarding conversion rate by 27%.
- Engineered asynchronous background processing pipelines using Python and Celery to process 500,000+ daily financial transactions.
- Automated end-to-end integration testing using Cypress and Jest, increasing overall codebase test coverage from 55% to 92%.
- Integrated Stripe billing and OAuth 2.0 social login, accelerating recurring subscription revenue collection.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2015 - 2019
Honors: Dean's Honor List, Cum Laude

CERTIFICATIONS
- AWS Certified Solutions Architect - Associate (2023)
- Certified Kubernetes Administrator (CKA) (2022)`
  },

  data_scientist: {
    id: "data_scientist",
    name: "Sophia Chen - Data Scientist & ML Engineer",
    preferredLocation: "New York, NY",
    role: "Data Scientist",
    text: `SOPHIA CHEN
New York, NY | (555) 782-9381 | sophia.chen.ai@email.com | linkedin.com/in/sophiachenai | github.com/sophiachen-ml

PROFESSIONAL SUMMARY
Data Scientist and Machine Learning Engineer with 4+ years of industry experience building end-to-end predictive modeling pipelines, NLP systems, and recommendation engines. Proficient in Python, PyTorch, Scikit-Learn, SQL, and Snowflake with extensive experience deploying ML models to AWS production environments.

CORE COMPETENCIES
- Machine Learning & AI: Supervised/Unsupervised Learning, Deep Learning, NLP, Transformers, HuggingFace, XGBoost, Scikit-Learn, PyTorch
- Big Data & Analytics: SQL, Python, Pandas, NumPy, Apache Spark, Snowflake, dbt
- ML Engineering & MLOps: MLflow, Docker, FastAPI, AWS SageMaker, Airflow, Weights & Biases
- Visualization & BI: Tableau, PowerBI, Matplotlib, Seaborn
- Experimentation: A/B Testing, Hypothesis Testing, Statistical Modeling, Causal Inference

PROFESSIONAL EXPERIENCE
Machine Learning Engineer | DataCore Analytics, New York, NY | 2022 - Present
- Engineered customer churn prediction model using XGBoost and PyTorch, achieving an ROC-AUC of 0.91 and saving $1.2M in annual customer retention.
- Built an automated NLP pipeline for customer feedback categorization processing 80,000+ reviews weekly using BERT and HuggingFace.
- Deployed real-time inference microservices on AWS SageMaker with FastAPI and Docker, maintaining sub-45ms latency under 2,000 QPS load.
- Designed and analyzed 14 rigorous A/B experiments to evaluate personalized recommendations, driving an 18% lift in average order value.

Data Analyst | Horizon Media Group, Boston, MA | 2020 - 2022
- Formulated complex SQL queries and dbt transformations across 40TB Snowflake data warehouse to support marketing attribution.
- Created executive Tableau dashboards tracking customer lifetime value (LTV) and CAC across 6 acquisition channels.
- Partnered with product managers to define tracking events and KPIs, reducing data discrepancy by 22%.

EDUCATION
Master of Science in Data Science | Columbia University, New York, NY (2018 - 2020)
Bachelor of Science in Statistics | University of Michigan, Ann Arbor, MI (2014 - 2018)`
  },

  junior_developer: {
    id: "junior_developer",
    name: "Jordan Lee - Junior Web Developer (Improvement Candidate)",
    preferredLocation: "Bangalore, India",
    role: "Junior Web Developer",
    text: `JORDAN LEE
Bangalore, India | jordan.dev99@email.com

OBJECTIVE
Looking for an entry level web developer job in a growing tech company where I can use my computer skills and learn new technologies.

SKILLS
HTML, CSS, JavaScript, React basics, Git

EXPERIENCE
Intern | WebSol Agency (2023 - 2024)
- Responsible for helping team with web design.
- Worked on fixing bugs in website.
- Assisted senior developers with making frontend pages.
- Handled daily meetings and helped with client requests.

Student Projects
- Built a weather app using JavaScript and API.
- Made a simple to-do list application using React.
- Created portfolio website.

EDUCATION
Bachelor of Technology in Information Technology
ABC Institute of Technology (2020 - 2024)`
  }
};

module.exports = { sampleResumes };
