def test_signup(client):
    response = client.post("/auth/signup", json={
        "email": "newuser@example.com",
        "password": "secretpassword",
        "full_name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

def test_signup_duplicate_email(client):
    response = client.post("/auth/signup", json={
        "email": "test@example.com",
        "password": "secretpassword",
        "full_name": "Test User"
    })
    assert response.status_code == 400

def test_login_success(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_refresh_token(client):
    # First login to get a refresh token
    login_response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    refresh_token = login_response.json()["refresh_token"]

    # Use it to get a new token pair
    response = client.post("/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
