## Como tornar sua api Node.js mais segura com autenticação JWT

#### O que é jwt?

JSON Web Token é uma padrão aberto (RFC 7519) que define um compacto e unico jeito de transmitir informações entre duas partes com um objeto json. Esta informação pode ser verificada e confiavel 
porque foi digitalmente assinada. JWT's podem ser assinadas utilizando um segredo (com algoritmo HMAC) ou uma chave publica/privada utilizando RSA ou ECDSA. (https://jwt.io/introduction)

#### Como funciona?

Por exemplo, você possuí a seguinte request:

POST http://api_exemplo.com.br/sessions

{
  "login": "fulano_123",
  "password": "password_padrao123"
}

A api vai verificar se as informações batem com as existentes no banco e se tudo estiver correto ela irá gerar o token 
JWT com o seguinte formato:

<span style="color:red">eyJhbGciOiJIUzL1NilslnR5cCI6lkpXVCj9</span>.
<span style="color:blue">eyJzdWliOilxMjM0NTY30DkwliwibmFtZSl6lkpvaG4gRG9lliwiaWF0ljoxNTE2MjM5MDlyfQ</span>.
<span style="color:green">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</span>

O token foi separado em partes para uma melhor explicação. A estrutura segue a seguinte definição:

- <span style="color:red">Headers do token, onde estão localizados informações sobre o tipo do token e da criptografia utilizada.</span>
- <span style="color:blue">Payload, onde fica armazenado as informações não sensíveis do usuário, por exemplo o id do usuário ou nome.</span>
- <span style="color:green">Assinatura do token, a garantia que o token não foi modificado durante seu transporte e a veracidade das informações.</span>