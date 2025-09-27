#!/usr/bin/env python3
import subprocess
import sys
import time

COMPOSE_FILE = "docker/compose.dev.yml"

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

def main():
    if len(sys.argv) < 2:
        print("Uso: python orchestrator.py [all|cassandra|cassandra+setup|faker]")
        sys.exit(1)

    mode = sys.argv[1]

    if mode == "all":
        run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)
        wait_for_cassandra()
        run(f"docker compose -f {COMPOSE_FILE} up cassandra-setup")
        run(f"docker compose -f {COMPOSE_FILE} up faker-seed")

    elif mode == "cassandra":
        run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)

    elif mode == "cassandra+setup":
        run(f"docker compose -f {COMPOSE_FILE} up -d cassandra", detach=True)
        wait_for_cassandra()
        run(f"docker compose -f {COMPOSE_FILE} up cassandra-setup")

    elif mode == "faker":
        run(f"docker compose -f {COMPOSE_FILE} up --no-deps faker-seed")

    else:
        print("❌ Modo no válido. Usa uno de: all, cassandra, cassandra+setup, faker")
        sys.exit(1)

if __name__ == "__main__":
    main()
