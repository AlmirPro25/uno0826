import bcrypt
password = b'415263456a'
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())
