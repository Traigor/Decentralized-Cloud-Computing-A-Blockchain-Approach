import java.util.Random;

class Verification{
  private String ver_string = "Helloworld!";

  public String getVerification()
  {
    return ver_string;
  }
}

class Computation
{
  public long getComputation()
  {
    long k=0;
    Random rand = new Random();
    long n = rand.nextLong(System.currentTimeMillis()/1000000);
    long m = rand.nextLong(System.currentTimeMillis()/1000000);
    for (long i = 1; i < n; i++)
    {
      for (int j = 1; j < m; j++)
      {
        k = n+m;
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
    Computation F = new Computation();
    String ver = V.getVerification();
    String res = String.valueOf(F.getComputation());
    T.end();
    System.out.print(res+ " ----- " +ver + " ----- " + T.getExecutionTime() + " ----- " + T.getEndTime()+"\n");
  }
}