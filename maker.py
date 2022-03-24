script = 'import time, json, sys, hashlib, psutil'
try:
    f = open("imports.txt", "r")
except FileNotFoundError:
    pass
else:
    lines = f.readlines()
    for l in lines:
        script += ", " + l

script += "\n\n"


script += 'start = time.time() \n\n'

fct = ''
#read users function
f = open("user_function.txt", "r")
lines = f.readlines()
f.close()

for l in lines:
    fct += "\t" + l

script += 'def user_function():\n' + fct + "\n\n"

vrf = ''
#read verification_function
vrf_by_user = False
seed = "seed"

try:
    f = open("verification_function.txt", "r")
except FileNotFoundError:
    pass
else:
    vrf_by_user = True

if vrf_by_user:
    lines = f.readlines()
    for l in lines:
        vrf += "\t" + l
    script += "def verification_function():\n" + vrf +"\n\n\n"
    f.close()
    seed = ""

else:
    script += "def verification_function(seed):\n"
    script += "\thashed_seed = hashlib.sha256(seed.encode()).hexdigest()\n"
    script += "\treturn hashed_seed\n\n\n"

script += 'if __name__ == "__main__":\n'
script += '\targs = sys.argv[1::]\n'
script += '\tseed = \"\"\n'
if not vrf_by_user:
    script += '\tcount = 0\n'
    script += '\tfor i in args:\n'
    script += '\t\tif count < len(args) -1:\n'
    script += '\t\t\tseed += i + \' \'\n'
    script += '\t\t\tcount += 1\n'
    script += '\t\telse:\n'
    script += '\t\t\tseed += i\n'
script += '\tres = user_function()\n'
script += '\tcpu = psutil.cpu_percent()\n'
script +=  "\ty = {\"Verification\":verification_function(" + seed + "),\n"
script +=  "\t\t\"Result\":res,\n"
script +=  "\t\t\"Time\":time.time() - start,\n"
script +=  "\t\t\"CPU Percentage\":cpu}\n"

script +=  "\t#metrics not exactly at exit time\n"

script += 'z = json.dumps(y)\n'
script += 'print(z)\n'



with open('script.py', 'w') as f:
    f.write(script)
f.close()
