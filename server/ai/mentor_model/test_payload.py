from server.ai.mentor_model.mentor_api import app


test_data = {
    "student_skills": "Python Machine Learning",
    "mentors": [
        {
            "id": 1,
            "name": "Alice",
            "email": "alice@test.com",
            "skills": ["python", "ml", "data science"],
            "experience": 5
        },
        {
            "id": 2,
            "name": "Bob",
            "email": "bob@test.com",
            "skills": ["java", "spring"],
            "experience": 8
        }
    ]
}

response = app.test_client().post(
    "/mentor-recommend",
    json=test_data
)

print(response.json)
