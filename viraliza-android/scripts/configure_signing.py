"""Prepare Android signing locally on a GitHub Actions runner from ONE repository secret.
No keystore, passwords, or credentials are ever committed to the public repository.
"""
import base64
import json
import os
from pathlib import Path

secret = os.environ.get("VIRALIZA_ANDROID_SIGNING_JSON", "")
if not secret:
    print("Assinatura não configurada: apenas validação de compilação (APK não instalável).")
    raise SystemExit(0)
info = json.loads(secret)
required = ["keystoreBase64", "storePassword", "keyAlias", "keyPassword"]
if not all(isinstance(info.get(x), str) and info[x] for x in required):
    raise SystemExit("Configuração de assinatura inválida: faltam campos necessários.")
keystore = base64.b64decode(info["keystoreBase64"], validate=True)
if not 100 < len(keystore) < 100000:
    raise SystemExit("Arquivo de assinatura inválido.")
temp = Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "viraliza-android-signing"
temp.mkdir(parents=True, exist_ok=True)
key = temp / "viraliza-release.jks"
key.write_bytes(keystore)
key.chmod(0o600)
props = temp / "signing.properties"
props.write_text("\n".join([
    "storeFile=" + str(key),
    "storePassword=" + info["storePassword"],
    "keyAlias=" + info["keyAlias"],
    "keyPassword=" + info["keyPassword"],
]) + "\n")
props.chmod(0o600)
with open(os.environ["GITHUB_ENV"], "a") as out:
    out.write("VIRALIZA_SIGNING_FILE=" + str(props) + "\n")
    out.write("VIRALIZA_IS_SIGNED=true\n")
print("Assinatura carregada com segurança para este build.")
