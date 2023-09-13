function calculatePayment(price, duration) {
  return {
    pending: price * duration - price * 2, //clientCollateral = price * 2
    completed: price * duration,
  }
}

export default calculatePayment
