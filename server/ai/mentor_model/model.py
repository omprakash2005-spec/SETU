import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------- Helpers ----------

def normalize(text):
    if not text:
        return set()

    text = text.lower()

    replacements = {
        "c++": "cplusplus",
        "c#": "csharp",
        ".net": "dotnet"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    return set(text.replace(",", " ").split())


def parse_skills(skills):
    def clean(s):
        s = s.lower().strip()
        s = s.replace("c++", "cplusplus")
        s = s.replace("c#", "csharp")
        s = s.replace(".net", "dotnet")
        return s

    if isinstance(skills, list):
        result = []
        for s in skills:
            if isinstance(s, str) and "," in s:
                result.extend([clean(x) for x in s.split(",")])
            elif isinstance(s, str):
                result.append(clean(s))
        return result

    if isinstance(skills, str):
        try:
            parsed = json.loads(skills)
            if isinstance(parsed, list):
                return parse_skills(parsed)
        except Exception:
            pass

        return [clean(s) for s in skills.split(",")]

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
def parse_experience(exp):
    """
    Converts experience into a numeric value (years).
    """
    if isinstance(exp, int) or isinstance(exp, float):
        return exp

    if isinstance(exp, list) and exp:
        exp = exp[0]

    if isinstance(exp, str):
        digits = "".join(ch for ch in exp if ch.isdigit())
        return int(digits) if digits else 0

    return 0

def recommend_mentors(student_skills, mentors, limit=50, min_score=0.0):

    # ✅ Normalize student skills safely
    if isinstance(student_skills, str):
        student_skills = student_skills.split(",")

    student_skills_text = " ".join(parse_skills(student_skills))
    
    # Calculate total number of unique student skills
    student_skills_set = normalize(student_skills_text)
    total_student_skills = len(student_skills_set) if student_skills_set else 1

    if not mentors:
        return []

    # ✅ Prepare mentor texts
    mentor_texts = [
        " ".join(parse_skills(m.get("skills", [])))
        for m in mentors
    ]

    vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')

    mentor_vectors = vectorizer.fit_transform(mentor_texts)
    student_vector = vectorizer.transform([student_skills_text])

    similarity_scores = cosine_similarity(
        student_vector, mentor_vectors
    )[0]

    results = []

    for idx, mentor in enumerate(mentors):
        mentor_skills = parse_skills(mentor.get("skills", []))

        skill_match_count = count_skill_overlap(
            student_skills_text, mentor_skills
        )
        
        # Calculate match percentage based on skill overlap
        match_percentage = round((skill_match_count / total_student_skills) * 100)
        print(f"🔢 Mentor {mentor.get('name')}: skill_match_count={skill_match_count}, total_student_skills={total_student_skills}, match_percentage={match_percentage}%")

        if similarity_scores[idx] >= min_score:
            results.append({
                "id": mentor.get("id"),
                "name": mentor.get("name"),
                "email": mentor.get("email"),
                "skills": mentor_skills,
                "experience": parse_experience(mentor.get("experience")),

                "profile_image": mentor.get("profile_image"),
                "score": float(similarity_scores[idx]),
                "skill_match_count": skill_match_count,
                "match_percentage": match_percentage,
                "matched_skills": matched_skills(
                    student_skills_text, mentor_skills
                )
            })

    # Helper to safely extract numeric experience
    def get_experience_value(exp):
        if exp is None:
            return 0
        if isinstance(exp, (int, float)):
            return exp
        if isinstance(exp, list):
            # If it's a list, try to get the first numeric element
            for item in exp:
                if isinstance(item, (int, float)):
                    return item
            return 0
        if isinstance(exp, str):
            # Try to extract a number from string
            try:
                return int(exp)
            except (ValueError, TypeError):
                return 0
        return 0
    
    results.sort(
        key=lambda x: (
            x["skill_match_count"],
            x["score"],
            get_experience_value(x["experience"])
        ),
        reverse=True
    )

    return results[:limit]