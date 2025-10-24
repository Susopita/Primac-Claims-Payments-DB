#!/usr/bin/env python3
import boto3
import subprocess
import sys
import time
import argparse
import getpass
import os

COMPOSE_FILE = "docker/compose.dev.yml"


# ================================
# 🧩 Utilidades
# ================================

def run(cmd, detach=False):
    """Ejecuta un comando y devuelve el código de salida"""
    print(f"👉 {cmd}")
    if detach:
        return subprocess.run(cmd, shell=True).returncode
    else:
        return subprocess.run(cmd, shell=True).returncode

def wait_for_cassandra():
    """Espera hasta que Cassandra esté healthy"""
    print("⏳ Esperando a Cassandra...")
    while True:
        status = subprocess.run(
            "docker inspect --format='{{.State.Health.Status}}' cassandra",
            shell=True,
            capture_output=True,
            text=True
        )
        if status.stdout.strip() == "healthy":
            print("✅ Cassandra está listo")
            break
        time.sleep(5)

def get_session_from_input(name: str):
    """Solicita credenciales manualmente"""
    print(f"\n=== Iniciando sesión para {name} ===")
    access_key = getpass.getpass("AWS_ACCESS_KEY_ID: ").strip()
    secret_key = getpass.getpass("AWS_SECRET_ACCESS_KEY: ").strip()
    session_token = getpass.getpass("AWS_SESSION_TOKEN (opcional): ").strip() or None

    return boto3.Session(
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token,
    )


def get_default_session():
    """Usa las credenciales locales (perfil por defecto o .aws/credentials)"""
    return boto3.Session()


def run_with_session(session: boto3.Session, cmd: list[str], extra_env: dict[str, str] | None = None):
    """Ejecuta un comando con las credenciales AWS de una sesión específica"""
    creds = session.get_credentials().get_frozen_credentials()
    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = creds.access_key
    env["AWS_SECRET_ACCESS_KEY"] = creds.secret_key
    if creds.token:
        env["AWS_SESSION_TOKEN"] = creds.token

    # Agregar entorno adicional (si se pasa)
    if extra_env:
        env.update(extra_env)

    subprocess.run(cmd, env=env, check=True)

def accept_peering(session: boto3.Session, peering_id: str):
    ec2 = session.client("ec2")
    ec2.accept_vpc_peering_connection(VpcPeeringConnectionId=peering_id)
    print(f"✅ Peering {peering_id} aceptado correctamente.")


def main():
    parser = argparse.ArgumentParser(description="Orquestador de infraestructura Primac")
    parser.add_argument("--all", action="store_true", help="Desplegar toda la infraestructura local (Cassandra + Faker)")
    parser.add_argument("--cassandra", action="store_true", help="Iniciar solo Cassandra")
    parser.add_argument("--setup", action="store_true", help="Configurar Cassandra")
    parser.add_argument("--faker", action="store_true", help="Ejecutar semilla de datos faker")
    parser.add_argument("--prod", action="store_true", help="Desplegar infraestructura principal en AWS (Account A)")
    parser.add_argument("--analytics", action="store_true", help="Desplegar endpoint de analytics (Account B)")
    parser.add_argument("--destroy", action="store_true", help="Destruir stacks AWS")
    args = parser.parse_args()

    # Construimos una tupla con las flags activas para hacer match
    key = (
        args.all,
        args.cassandra,
        args.setup,
        args.faker,
        args.prod,
        args.analytics,
        args.destroy
    )

    match key:
        # ===================================
        # 🐘 Local: Docker + Cassandra
        # ===================================
        case (True, False, False, False, False, False, False):
            print("🚀 Desplegando todo el entorno local...")
            run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)
            wait_for_cassandra()
            run(f"docker compose -f {COMPOSE_FILE} up cassandra-setup")
            run(f"docker compose -f {COMPOSE_FILE} up faker-seed")

        case (False, True, False, False, False, False, False):
            print("💾 Iniciando solo Cassandra...")
            run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)

        case (False, False, True, False, False, False, False):
            print("⚙️ Ejecutando setup de Cassandra...")
            run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)
            wait_for_cassandra()
            run(f"docker compose -f {COMPOSE_FILE} up cassandra-setup")

        case (False, False, False, True, False, False, False):
            print("🎲 Ejecutando seeding con faker...")
            run(f"docker compose -f {COMPOSE_FILE} up --no-deps faker-seed")

        # ===================================
        # ☁️ AWS: Stacks de infraestructura
        # ===================================
        case (False, False, False, False, True, False, False):
            print("🏗️ Desplegando infraestructura principal (Account A)...")
            session_A = get_default_session()
            run_with_session(session_A, ["cdk", "deploy", "--app", "npx ts-node infra/bin/infra.ts"])

        case (False, False, False, False, False, True, False):
            print("📊 Desplegando endpoint de analytics (Account B)...")
            session_A = get_default_session()
            session_B = get_session_from_input("Account B (Analytics)")
            run_with_session(session_B, ["cdk", "deploy", "--app", "npx ts-node analytics/bin/analytics.ts"], {
                "AWS_EXTERNAL_ACCESS_KEY_ID": session_A.get_credentials().access_key,
                "AWS_EXTERNAL_SECRET_ACCESS_KEY": session_A.get_credentials().secret_key,
                "AWS_EXTERNAL_SESSION_TOKEN": session_A.get_credentials().token,
            })

        # ===================================
        # 💣 Destrucción
        # ===================================
        case (False, False, False, False, False, False, True):
            print("💥 Destruyendo infraestructura...")
            session_A = get_default_session()
            run_with_session(session_A, ["cdk", "destroy", "--app", "npx ts-node infra/bin/infra.ts", "--force"])

        # ===================================
        # ❌ Caso no reconocido
        # ===================================
        case _:
            print("❌ Comando no válido. Usa uno de: --all, --cassandra, --setup, --faker, --prod, --analytics, --destroy")
            sys.exit(1)

if __name__ == "__main__":
    main()
