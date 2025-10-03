USE primac_db;

CREATE TABLE reclamos (
    reclamo_id UUID,
    cliente_id INT,
    poliza_id INT,
    fecha TIMESTAMP,
    estado TEXT,
    monto DECIMAL,
    descripcion TEXT,
    PRIMARY KEY ((cliente_id), fecha, reclamo_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE pagos (
    pago_id UUID,
    cliente_id INT,
    poliza_id INT,
    fecha TIMESTAMP,
    monto DECIMAL,
    metodo TEXT,
    estado TEXT,
    PRIMARY KEY ((cliente_id), fecha, pago_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE transaction_audit (
    audit_id UUID,
    servicio TEXT,
    operacion TEXT,
    entidad TEXT,
    referencia_id TEXT,
    usuario_id INT,
    fecha TIMESTAMP,
    detalle TEXT,
    PRIMARY KEY ((servicio), fecha, audit_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

