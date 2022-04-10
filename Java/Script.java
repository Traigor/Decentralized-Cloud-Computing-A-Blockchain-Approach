import java.io.*;
import java.util.*;
import java.util.ArrayList;
import java.util.List;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;


class Verification{
  private String ver_string = "Hello there, you are verified!";
  public String getVerification()
  {
    return ver_string;
  }
}

class myFunction
{
  private int ComputeResult()
  {
    int count = 0;
    for (int i=0;i<100000;i++)
      for (int j=0;j<1000;j++)
        for (int z=0;z<20000;z=z+2)
          count++;
    return count;
  }
  public String getResult()
  {
    int res = ComputeResult();
    return "The result is: "+String.valueOf(res);
  }
}

public class Script {

  public static void main(String[] args) {
    final long startTime = System.currentTimeMillis();
    Verification V = new Verification();
    myFunction F = new myFunction();
    OperatingSystemMXBean operatingSystemMXBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
    System.out.println("Verification: "+V.getVerification());
    System.out.println("Function: "+F.getResult());
    System.out.println("Memory: "+(Runtime.getRuntime().totalMemory()-Runtime.getRuntime().freeMemory())/(1000.0*1000.0)+" MB");
    System.out.println("Max Available Memory: "+(Runtime.getRuntime().maxMemory())/(1000.0*1000.0)+" MB");
    System.out.println("CPU Usage: " + operatingSystemMXBean.getProcessCpuLoad()*100 +" %");
    final long endTime = System.currentTimeMillis();
    System.out.println("Time: " + (endTime - startTime) +" msec");
  }
}
