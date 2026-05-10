async function requestAuth(path, payload) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

export function login(payload) {
  return requestAuth("login", payload);
}

export function signup(payload) {
  return requestAuth("signup", payload);
}

export async function fetchUsers() {
  const response = await fetch("/api/users");
  return response.json();
}



export async function clearThreadWithUser(actingUsername, partnerUsername) {
  const acting = String(actingUsername || "").trim().toLowerCase();
  const partner = String(partnerUsername || "").trim().toLowerCase();
  const response = await fetch("/api/messages/clear-thread", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-acting-user": acting
    },
    body: JSON.stringify({ withUser: partner })
  });
  return response.json().catch(() => ({ success: false }));
}
