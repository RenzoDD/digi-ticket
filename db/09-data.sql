DELIMITER //

INSERT INTO Deparments (Name)
VALUES ("General Support"), ("DNS Support"), ("FTP Support") //

CALL Users_Create(1, null, "Jefferson Valenzuela", "jefferson@remadi.net", "1234") //
CALL Users_Create(1, null, "Yefferson Carreño", "yefferson@remadi.net", "1234") //

CALL Users_Create(3, 1, "Jorge Coronado", "jorge@remadi.net", "1234") //
CALL Users_Create(2, 1, "Benhur Carbajal", "benhur@remadi.net", "1234") //

CALL Users_Create(3, 2, "Carlos Colina", "carlos@remadi.net", "1234") //
CALL Users_Create(2, 2, "Leonel Ramirez", "leonel@remadi.net", "1234") //

CALL Users_Create(4, 3, "Renzo Diaz", "renzo@remadi.net", "1234") //
CALL Users_Create(4, 3, "Andres Mares", "andres@remadi.net", "1234") //