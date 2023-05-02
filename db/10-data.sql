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

INSERT INTO FAQ (Question, Answer)
VALUES  ("What types of web hosting plans do you offer?", "We offer shared hosting, VPS hosting, dedicated hosting, and cloud hosting plans."),
        ("Do you offer website building tools or templates?", "Yes, we offer website builders and templates that make it easy to create a professional-looking website."),
        ("What is the uptime guarantee for your hosting service?", "We offer a 99.9% uptime guarantee, which means that your website will be up and running 99.9% of the time."),
        ("What security measures do you have in place to protect my website?", "We employ multiple security measures, including SSL certificates, firewalls, and DDoS protection, to ensure the safety and security of your website."),
        ("How do I upgrade or downgrade my hosting plan?", "You can easily upgrade or downgrade your hosting plan through our website or by contacting our customer support team."),
        ("Do you offer domain registration services?", "Yes, we offer domain registration services for a wide range of domain extensions."),
        ("Can I use my own domain name with your hosting service?", "Yes, you can use your own domain name with our hosting service."),
        ("How do I transfer my website to another hosting provider?", "You can transfer your website to another hosting provider by downloading a backup of your website files and databases, and then uploading them to your new hosting provider."),
        ("Do you offer any discounts or promotions for new customers?", "Yes, we offer various discounts and promotions for new customers, including discounts on hosting plans and domain registration fees.");