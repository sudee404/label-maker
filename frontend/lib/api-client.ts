async function callApi(endpoint: string, method = "POST", data?: any) {
  const response = await fetch("/api/proxy", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endpoint, method, data }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "API call failed")
  }

  return response.json()
}

export { callApi }
