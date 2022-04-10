import time, json, sys, hashlib, psutil

start = time.time() 

def user_function():
	def fibo(n):
	  fibonacci_numbers = [0, 1]
	  for i in range(2,n):
	      fibonacci_numbers.append(fibonacci_numbers[i-1]+fibonacci_numbers[i-2])
	  return fibonacci_numbers[n-1] + fibonacci_numbers[n-2]
	
	return fibo(42)


def verification_function(seed):
	hashed_seed = hashlib.sha256(seed.encode()).hexdigest()
	return hashed_seed


if __name__ == "__main__":
	args = sys.argv[1::]
	seed = ""
	count = 0
	for i in args:
		if count < len(args) -1:
			seed += i + ' '
			count += 1
		else:
			seed += i
	res = user_function()
	cpu = psutil.cpu_percent()
	y = {"Verification":verification_function(seed),
		"Result":res,
		"Time":time.time() - start,
		"CPU Percentage":cpu}
	#metrics not exactly at exit time
z = json.dumps(y)
print(z)
