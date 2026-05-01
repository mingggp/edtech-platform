def test_list_courses(client):
    response = client.get("/courses")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_create_course(client):
    # Setup admin user
    login_response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    token = login_response.json()["access_token"]

    # We need the user to be admin for creating a course
    # By default test user is not admin, so it should fail with 403
    response = client.post("/admin/courses", json={
        "title": "Test Course",
        "description": "A new test course",
        "price": 1000.0,
        "category": "Math"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
