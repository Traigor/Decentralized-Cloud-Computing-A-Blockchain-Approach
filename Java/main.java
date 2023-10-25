
class Main {
  public static void main(String[] args) {
    Time T = new Time();
    T.start();
    Code C = new Code();
    String ver = C.getVerification();
    String res = C.getComputation();
    T.end();
    System.out.print(res+ " ----- " +ver + " ----- " + T.getExecutionTime() + " ----- " + T.getEndTime()+"\n");
  }
}
