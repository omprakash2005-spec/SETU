from flask import Flask, request, jsonify
from model import recommend_mentors

app = Flask(__name__)

@app.route("/mentor-recommend", methods=["POST"])
def mentor_recommend():
    data = request.get_json()
    skills = data.get("skills", "")
    return jsonify(recommend_mentors(skills))

if __name__ == "__main__":
    print("Mentor AI server starting...")
    app.run(host="127.0.0.1", port=8000)
