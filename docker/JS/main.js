function fibonacci(n) {
  if (n < 2) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}
function main() {
  const test = fibonacci(15);
  console.log("Testing...", test);
}

function verification() {
  console.log("Verification: Hello World!");
}

export { main, verification };
