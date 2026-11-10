"""
NotHub API test.

1. Start the server in one terminal:   python app.py
2. Run this file in a second terminal: python test_api.py
"""
import time

import requests

BASE = "http://127.0.0.1:5000"

# A Session remembers the login cookie between requests, like a browser does.
s = requests.Session()

# A new email every run, so "register" works each time.
email = f"test{int(time.time())}@example.com"
password = "password123"


def check(label, response, expected):
    result = "PASS" if response.status_code == expected else "FAIL"
    print(f"{result}  {label}  (got {response.status_code}, expected {expected})")
    print("     ", response.json())


check("me before login (user should be null)", s.get(f"{BASE}/api/me"), 200)

check(
    "register a new account",
    s.post(f"{BASE}/api/register", json={"name": "Test", "email": email, "password": password}),
    201,
)

check("me after register (should show your user)", s.get(f"{BASE}/api/me"), 200)

check("logout", s.post(f"{BASE}/api/logout"), 200)

check("me after logout (user should be null)", s.get(f"{BASE}/api/me"), 200)

check(
    "login with wrong password",
    s.post(f"{BASE}/api/login", json={"email": email, "password": "wrong-password"}),
    401,
)

check(
    "login with correct password",
    s.post(f"{BASE}/api/login", json={"email": email, "password": password}),
    200,
)

check(
    "register the same email again",
    s.post(f"{BASE}/api/register", json={"name": "Test", "email": email, "password": password}),
    409,
)

check(
    "register with a short password",
    s.post(f"{BASE}/api/register", json={"name": "Test", "email": "other@example.com", "password": "123"}),
    400,
)

check(
    "register with an invalid email",
    s.post(f"{BASE}/api/register", json={"name": "Test", "email": "not-an-email", "password": password}),
    400,
)