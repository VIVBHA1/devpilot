-- ============================================================
-- Skill taxonomy seed data — 3 domains, ~4 sub-disciplines each,
-- ~4-6 tools per sub-discipline. Source: Devbuild-Skill-Taxonomy.xlsx
-- Run after migration_change2_001_taxonomy.sql.
-- ============================================================

do $$
declare
  d_fullstack uuid;
  d_aiml uuid;
  d_data uuid;
  s_id uuid;
begin
  insert into skill_domains (name) values ('Full-stack development') returning id into d_fullstack;
  insert into skill_domains (name) values ('AI/ML') returning id into d_aiml;
  insert into skill_domains (name) values ('Data & analytics') returning id into d_data;

  -- Full-stack development
  insert into skill_subdisciplines (domain_id, name) values (d_fullstack, 'Frontend engineering') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'React'), (s_id, 'Next.js'), (s_id, 'Vue.js'), (s_id, 'TypeScript'), (s_id, 'Tailwind CSS');

  insert into skill_subdisciplines (domain_id, name) values (d_fullstack, 'Backend engineering') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'Node.js'), (s_id, 'Python (Django/FastAPI)'), (s_id, 'Java/Spring'), (s_id, 'PostgreSQL/MySQL'), (s_id, 'REST/GraphQL APIs');

  insert into skill_subdisciplines (domain_id, name) values (d_fullstack, 'Mobile development') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'React Native'), (s_id, 'Flutter'), (s_id, 'Swift/iOS'), (s_id, 'Kotlin/Android');

  insert into skill_subdisciplines (domain_id, name) values (d_fullstack, 'Full-stack generalist') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'Frontend + backend basics'), (s_id, 'Docker'), (s_id, 'CI/CD'), (s_id, 'Cloud basics (AWS/GCP)');

  -- AI/ML
  insert into skill_subdisciplines (domain_id, name) values (d_aiml, 'Classical ML & predictive modeling') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'scikit-learn'), (s_id, 'XGBoost/LightGBM'), (s_id, 'Feature engineering'), (s_id, 'Statistical modeling');

  insert into skill_subdisciplines (domain_id, name) values (d_aiml, 'Deep learning & computer vision') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'PyTorch'), (s_id, 'TensorFlow'), (s_id, 'OpenCV'), (s_id, 'Image classification/detection');

  insert into skill_subdisciplines (domain_id, name) values (d_aiml, 'NLP & LLM/GenAI engineering') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'Hugging Face Transformers'), (s_id, 'LangChain/LlamaIndex'), (s_id, 'Prompt engineering'), (s_id, 'Fine-tuning & RAG');

  insert into skill_subdisciplines (domain_id, name) values (d_aiml, 'MLOps & deployment') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'MLflow/Weights & Biases'), (s_id, 'Docker/Kubernetes for ML'), (s_id, 'Model monitoring'), (s_id, 'CI/CD for ML');

  -- Data & analytics
  insert into skill_subdisciplines (domain_id, name) values (d_data, 'Data engineering') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'SQL'), (s_id, 'Airflow/dbt'), (s_id, 'Spark'), (s_id, 'Snowflake/BigQuery/Redshift');

  insert into skill_subdisciplines (domain_id, name) values (d_data, 'Business intelligence & analytics') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'Power BI'), (s_id, 'Tableau'), (s_id, 'Looker'), (s_id, 'Advanced Excel/Sheets');

  insert into skill_subdisciplines (domain_id, name) values (d_data, 'Data science & statistics') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'Python (Pandas/NumPy)'), (s_id, 'R'), (s_id, 'A/B testing'), (s_id, 'Statistical inference');

  insert into skill_subdisciplines (domain_id, name) values (d_data, 'Data visualization & reporting') returning id into s_id;
  insert into skill_tools (subdiscipline_id, name) values
    (s_id, 'D3.js'), (s_id, 'Plotly'), (s_id, 'Dashboard design'), (s_id, 'Data storytelling');
end $$;
