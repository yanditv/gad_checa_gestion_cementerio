IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'cementerio')
BEGIN
    CREATE DATABASE [cementerio];
END
