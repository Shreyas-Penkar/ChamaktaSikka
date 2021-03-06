import requests
from cryptography.hazmat.primitives import serialization as crypto_serialization,hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import padding
import json

all_users = []
all_users_private_keys = []
ports = [5000, 5001, 5002, 5003]

def hash_dict(dict_to_hash):
  digest = hashes.Hash(hashes.SHA256())
  digest.update(json.dumps(dict_to_hash, sort_keys=True).encode('utf-8'))
  hash_value = digest.finalize()
  return hash_value.hex()

for i in ports:
  key = rsa.generate_private_key(
      backend=default_backend(),
      public_exponent=65537,
      key_size=512)

  private_key_pem = key.private_bytes(
      crypto_serialization.Encoding.PEM,
      crypto_serialization.PrivateFormat.PKCS8,
      crypto_serialization.NoEncryption())

  public_key_pem = key.public_key().public_bytes(
      encoding=crypto_serialization.Encoding.PEM,
      format=crypto_serialization.PublicFormat.SubjectPublicKeyInfo)

  all_users.append({
    'PORT': i,
    'public_key': public_key_pem.hex(),
    'hash_public_key': hash_dict(public_key_pem.hex())
  })

  all_users_private_keys.append({
    'PORT': i,
    'private_key': private_key_pem.hex(),
    'public_key': public_key_pem.hex(),
    'hash_public_key': hash_dict(public_key_pem.hex()),
    'wallet': 0,
  })


for user in all_users: 
  requests.post('http://localhost:{0}/api/update_connected_users'.format(user['PORT']), json={"all_users": all_users})

for user in all_users_private_keys:
  requests.post('http://localhost:{0}/api/provide_keys'.format(user['PORT']), json={"public_private_keys": user})


