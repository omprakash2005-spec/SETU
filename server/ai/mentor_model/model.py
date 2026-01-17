import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# ---------- Helpers ----------

def normalize(text):
    return set(re.findall(r"[a-zA-Z]+", text.lower()))

def count_skill_overlap(student_skills, mentor_expertise):
    return len(
        normalize(student_skills).intersection(
            normalize(mentor_expertise)
        )
    )

def matched_skills(student_skills, mentor_expertise):
    return list(
        normalize(student_skills).intersection(
            normalize(mentor_expertise)
        )
    )

# ---------- Load Data ----------

data = pd.read_csv("mentors.csv")

vectorizer = TfidfVectorizer()
mentor_vectors = vectorizer.fit_transform(data["Expertise"])

# ---------- Main Function ----------

def recommend_mentors(student_skills, limit=50, min_score=0.01):
    student_vector = vectorizer.transform([student_skills])
    similarity_scores = cosine_similarity(student_vector, mentor_vectors)[0]

    data["Score"] = similarity_scores
    data["Skill_Match_Count"] = data["Expertise"].apply(
        lambda x: count_skill_overlap(student_skills, x)
    )
    data["Matched_Skills"] = data["Expertise"].apply(
        lambda x: matched_skills(student_skills, x)
    )

    relevant = data[
        (data["Score"] >= min_score) &
        (data["Skill_Match_Count"] > 0)
    ]

    ranked = relevant.sort_values(
        by=["Skill_Match_Count", "Score", "Experience"],
        ascending=[False, False, False]
    )

    return ranked.head(limit)[[
        "Mentor_Name",
        "Expertise",
        "Experience",
        "Skill_Match_Count",
        "Matched_Skills",
        "Score"
    ]].to_dict(orient="records")
