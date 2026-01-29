from flask import Flask, request, jsonify
from flask_cors import CORS
from .model import recommend_mentors

app = Flask(__name__)
CORS(app)   # ✅ THIS IS THE FIX

@app.route("/mentor-recommend", methods=["POST"])
def mentor_recommend():
    data = request.get_json()

    student_skills = data.get("student_skills", "")
    mentors = data.get("mentors", [])
    
    print(f"🔍 Received {len(mentors)} mentors")
    if mentors:
        print(f"First mentor: {mentors[0]}")
    
    result = recommend_mentors(student_skills, mentors)
    
    print(f"📤 Returning {len(result)} recommendations")
    if result:
        print(f"First result: {result[0]}")

    return jsonify(result)


if __name__ == "__main__":
    print("Mentor AI server starting...")
    app.run(host="127.0.0.1", port=8000)

