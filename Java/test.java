class Verification{
  private String ver_string = "Hello world";
  public String getVerification()
  {
    return ver_string;
  }
}

class myFunction
{
  public long getFunction()
  {
    long k=0;
    for (int i = 0; i < 10000; i++)
    {
      for (int j = 0; j < 10000; j++)
      {
        k = i + j;
      }
    }
    return k;
  }
}

class Time
{
  private long startTime;
  private long endTime;
  public void start()
  {
    startTime = System.currentTimeMillis();
  }
  public void end()
  {
    endTime = System.currentTimeMillis();
  }
  public String getExecutionTime()
  {
    return String.valueOf(endTime - startTime);
  }
  public String getEndTime()
  {
    return String.valueOf(endTime);
  }
}


class Main {
  public static void main(String[] args) {
    Time T = new Time();
    T.start();
    Verification V = new Verification();
    myFunction F = new myFunction();
    String ver = V.getVerification();
    String res = String.valueOf(F.getFunction());
    T.end();
    System.out.print(res+ " ----- " +ver + " ----- " + T.getExecutionTime() + " ----- " + T.getEndTime()+"\n");
  }
}