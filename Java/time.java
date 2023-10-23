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