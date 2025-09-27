# Primac Claims Payments DB

This is a database for storing claims and payments for Primac.

---

## 🚀 Cómo usarlo en local

Ahora se incluye un **script de orquestación** (`orchestrator.py`) que simplifica levantar los servicios en diferentes modos.

### 1️⃣ Levantar todo (DB + schema + seed)

```bash
./orchestrator.py all
```

👉 Esto hará:

* Levantar Cassandra en segundo plano.
* Esperar a que esté listo.
* Ejecutar `cassandra-setup` para crear el schema.
* Ejecutar `faker-seed` para insertar datos de prueba.

---

### 2️⃣ Solo Cassandra (sin tablas ni datos)

```bash
./orchestrator.py cassandra
```

👉 Levanta solo la base de datos Cassandra.

---

### 3️⃣ Cassandra + Tablas (sin datos fake)

```bash
./orchestrator.py setup
```

👉 Levanta Cassandra (si no está corriendo) y crea el schema.

---

### 4️⃣ Insertar solo datos fake (si ya tienes Cassandra + schema)

```bash
./orchestrator.py faker
```

👉 Inserta datos fake sin volver a correr el setup ni reiniciar Cassandra.

---

⚙️ **Nota técnica**:
El script usa `docker compose -f docker/compose.dev.yml` como configuración base, por lo que **todos los comandos se ejecutan contra ese archivo**.
