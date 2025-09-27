USE primac_db;

CREATE TABLE IF NOT EXISTS reclamos (
    reclamo_id UUID,
    cliente_id UUID,
    poliza_id UUID,
    fecha TIMESTAMP,
    estado TEXT,
    monto DECIMAL,
    descripcion TEXT,
    PRIMARY KEY ((cliente_id), fecha, reclamo_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE IF NOT EXISTS pagos (
    pago_id UUID,
    cliente_id UUID,
    poliza_id UUID,
    fecha TIMESTAMP,
    monto DECIMAL,
    metodo TEXT,
    estado TEXT,
    PRIMARY KEY ((cliente_id), fecha, pago_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE IF NOT EXISTS transaction_audit (
    audit_id UUID,
    servicio TEXT,
    operacion TEXT,
    entidad TEXT,
    referencia_id UUID,
    usuario_id UUID,
    fecha TIMESTAMP,
    detalle TEXT,
    PRIMARY KEY ((servicio), fecha, audit_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

