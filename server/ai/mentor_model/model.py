import re
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------- Helpers ----------

def normalize(text):
    if not text:
        return set()
    return set(re.findall(r"[a-zA-Z]+", text.lower()))

def parse_skills(skills):
    if isinstance(skills, list):
        final = []
        for s in skills:
            if isinstance(s, str) and "," in s:
                final.extend([x.strip().lower() for x in s.split(",")])
            elif isinstance(s, str):
                final.append(s.strip().lower())
        return final

    if isinstance(skills, str):
        skills = skills.strip()

        # Try JSON
        try:
            parsed = json.loads(skills)
            if isinstance(parsed, list):
                return parse_skills(parsed)
        except Exception:
            pass

        # Comma-separated fallback
        return [s.strip().lower() for s in skills.split(",")]

    return []


def count_skill_overlap(student_skills, mentor_skills):
    return len(
        normalize(student_skills).intersection(
            normalize(" ".join(mentor_skills))
        )
    )

def matched_skills(student_skills, mentor_skills):
    return list(
        normalize(student_skills).intersection(
            normalize(" ".join(mentor_skills))
        )
    )

# ---------- Main Function ----------

def recommend_mentors(student_skills, mentors, limit=50, min_score=0.01):
    if not mentors:
        return []

    # Normalize student skills
    student_skills = " ".join(parse_skills(student_skills))

    # Prepare mentor texts
    mentor_texts = [
        " ".join(parse_skills(m.get("skills", [])))
        for m in mentors
    ]

    vectorizer = TfidfVectorizer()
    mentor_vectors = vectorizer.fit_transform(mentor_texts)
    student_vector = vectorizer.transform([student_skills])

    similarity_scores = cosine_similarity(
        student_vector, mentor_vectors
    )[0]

    results = []

    for idx, mentor in enumerate(mentors):
        mentor_skills = parse_skills(mentor.get("skills", []))

        skill_match_count = count_skill_overlap(
            student_skills, mentor_skills
        )

        if similarity_scores[idx] >= min_score:

            results.append({
                "id": mentor.get("id"),
                "name": mentor.get("name"),
                "email": mentor.get("email"),
                "skills": mentor_skills,
                "experience": mentor.get("experience", 0),
                "score": float(similarity_scores[idx]),
                "skill_match_count": skill_match_count,
                "matched_skills": matched_skills(
                    student_skills, mentor_skills
                )
            })

    results.sort(
        key=lambda x: (
            x["skill_match_count"],
            x["score"],
            x["experience"]
        ),
        reverse=True
    )

    return results[:limit]
