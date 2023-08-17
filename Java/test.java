import java.util.Random;

class Code {
  private String ver_string = "Helloworld!";

  public String getVerification()
  {
    return ver_string;
  }

  public long getComputation()
  {
    long k=0;
    Random rand = new Random();
    long n = rand.nextLong(System.currentTimeMillis()/1000000);
    long m = rand.nextLong(System.currentTimeMillis()/10000000);
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
    startTime = System.currentTimeMillis()/1000;
  }
  public void end()
  {
    endTime = System.currentTimeMillis()/1000;
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
    Code C = new Code();
    String ver = C.getVerification();
    String res = String.valueOf(C.getComputation());
    T.end();
    System.out.print(res+ " ----- " +ver + " ----- " + T.getExecutionTime() + " ----- " + T.getEndTime()+"\n");
  }
}