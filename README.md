# Diploma_Project
Python try: 

imports.txt, requirements.txt, user_function.txt and verification_function.txt are given by the user

script.py is created by maker.py

Container executes docker.sh

Ο χρήστης δίνει την συνάρτησή του σε python (user_function.txt), τα requirements της python (requirements.txt), τα modules που χρειάζεται (modules.txt) καθώς και την συνάρτηση ελέγχου αν θέλει (verification_function.txt).

O host εκτελεί το script docker.sh (αφού δώσει δικαιώματα στο αρχείο, chmod 777 docker.sh) το οποίο κάνει build και εκτελεί τον container.

Στον container εκτελείται το αρχείο maker.py το οποίο δημιουργεί το αρχείο που περιέχει τι πρέπει να εκτελεστεί για να επσιτραφεί στον χρήση (script.py)


Java try:

O host  εκτελεί το αρχείο Script.jar (χωρίς να έχει πρόσβαση στον κώδικα).

Περιορισμοί: το verification και τα metrics προστίθενται από τον χρήστη.
