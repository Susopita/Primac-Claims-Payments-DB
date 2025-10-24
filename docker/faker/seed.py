from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from faker import Faker
from tqdm import tqdm
import random, uuid, decimal

fake = Faker()

# Conexión al cluster
cluster = Cluster(["cassandra"])  # nombre del servicio en docker-compose
session = cluster.connect("primac_db")

# =========================
# PREPARED STATEMENTS
# =========================
insert_reclamo = session.prepare("""
    INSERT INTO reclamos (reclamo_id, cliente_id, poliza_id, fecha, estado, monto, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""")

insert_pago = session.prepare("""
    INSERT INTO pagos (pago_id, cliente_id, poliza_id, fecha, monto, metodo, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""")

insert_audit = session.prepare("""
    INSERT INTO transaction_audit (audit_id, servicio, operacion, entidad, referencia_id, usuario_id, fecha, detalle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""")

# =========================
# CONFIGURACIÓN
# =========================
TOTAL_RECLAMOS = 12000
TOTAL_PAGOS = 20000
TOTAL_AUDITS = 20000
BATCH_SIZE = 100

# =========================
# FUNCIÓN GENERAR RECLAMOS
# =========================
def seed_reclamos():
    estados = ["Pendiente", "Aprobado", "Rechazado"]
    with tqdm(total=TOTAL_RECLAMOS, desc="Insertando reclamos") as pbar:
        for i in range(0, TOTAL_RECLAMOS, BATCH_SIZE):
            batch = BatchStatement()
            for _ in range(BATCH_SIZE):
                batch.add(insert_reclamo, [
                    uuid.uuid4(),
                    random.randint(1, 15000),  # cliente_id
                    random.randint(1, 20000),  # poliza_id
                    fake.date_time_this_decade(),
                    random.choice(estados),
                    decimal.Decimal(random.randint(100, 5000)),
                    fake.text(max_nb_chars=200)
                ])
            session.execute(batch)
            pbar.update(BATCH_SIZE)

# =========================
# FUNCIÓN GENERAR PAGOS
# =========================
def seed_pagos():
    metodos = ["Tarjeta", "Transferencia", "Efectivo", "Yape", "Plin"]
    estados = ["Procesado", "Pendiente", "Fallido"]
    with tqdm(total=TOTAL_PAGOS, desc="Insertando pagos") as pbar:
        for i in range(0, TOTAL_PAGOS, BATCH_SIZE):
            batch = BatchStatement()
            for _ in range(BATCH_SIZE):
                batch.add(insert_pago, [
                    uuid.uuid4(),
                    random.randint(1, 15000),  # cliente_id
                    random.randint(1, 20000),  # poliza_id
                    fake.date_time_this_decade(),
                    decimal.Decimal(random.randint(50, 2000)),
                    random.choice(metodos),
                    random.choice(estados)
                ])
            session.execute(batch)
            pbar.update(BATCH_SIZE)

# =========================
# FUNCIÓN GENERAR AUDITORÍA
# =========================
def seed_audits():
    servicios = ["ReclamosAPI", "PagosAPI", "PolizasAPI"]
    operaciones = ["CREATE", "UPDATE", "DELETE", "READ"]
    entidades = ["Reclamo", "Pago", "Cliente", "Poliza"]
    with tqdm(total=TOTAL_AUDITS, desc="Insertando auditorías") as pbar:
        for i in range(0, TOTAL_AUDITS, BATCH_SIZE):
            batch = BatchStatement()
            for _ in range(BATCH_SIZE):
                batch.add(insert_audit, [
                    uuid.uuid4(),
                    random.choice(servicios),
                    random.choice(operaciones),
                    random.choice(entidades),
                    str(random.randint(1, 20000)),   # referencia_id
                    random.randint(1, 20000),   # usuario_id
                    fake.date_time_this_decade(),
                    fake.sentence(nb_words=12)
                ])
            session.execute(batch)
            pbar.update(BATCH_SIZE)

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    seed_reclamos()
    seed_pagos()
    seed_audits()
    print("✅ Inserción masiva completada en todas las tablas")
