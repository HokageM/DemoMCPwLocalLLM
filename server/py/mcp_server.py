from fastapi import FastAPI
from fastapi_mcp import FastApiMCP

app = FastAPI(title="Math API")

@app.get("/")
def root():
    return {
        "message": "Math API is running",
        "try": {
            "docs": "/docs",
            "add": {"method": "POST", "path": "/add", "body": {"a": 1, "b": 2}},
            "multiply": {"method": "POST", "path": "/multiply", "body": {"a": 3, "b": 4}},
        },
    }

@app.post("/add", operation_id="add")
def add_numbers(a: int, b: int):
    return {"operation": "add", "a": a, "b": b, "result": a + b}

@app.post("/multiply", operation_id="multiply")
def multiply_numbers(a: int, b: int):
    return {"operation": "multiply", "a": a, "b": b, "result": a * b}

if __name__ == "__main__":
    mcp = FastApiMCP(app)
    mcp.mount_http()

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
