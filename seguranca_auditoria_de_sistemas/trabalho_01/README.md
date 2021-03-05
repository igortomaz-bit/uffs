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

eyJhbGciOiJIUzL1NilslnR5cCI6lkpXVCj9. [1]<br>
eyJzdWliOilxMjM0NTY30DkwliwibmFtZSl6lkpvaG4gRG9lliwiaWF0ljoxNTE2MjM5MDlyfQ. [2]<br>
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c [3]

O token foi separado em partes para uma melhor explicação. A estrutura segue a seguinte definição:

- [1] Headers do token, onde estão localizados informações sobre o tipo do token e da criptografia utilizada.
- [2] Payload, onde fica armazenado as informações não sensíveis do usuário, por exemplo o id do usuário ou nome.
- [3] Assinatura do token, a garantia que o token não foi modificado durante seu transporte e a veracidade das informações.

### Aplicação

Para criação deste exemplo foi utilizado as seguintes ferramentas:

- [Javascript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
- [Node.js](https://nodejs.org/en/)
- [Pacote npm - Jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [Pacote npm - Crypto](https://nodejs.org/api/crypto.html)

Para a criação do token a ser utilizado na autenticação da api no exemplo, foi adicionado uma rota /session 
onde é enviado como exemplo login e senha do usuário como "teste". 

O processo de geração do token acontece no session service, onde o password é encriptado para 
simular o processo que ele faria normalmente ao tentar verificar se o usuário existe no banco e 
autenticar antes de gerar o token. Também é validado se o login e senha foram enviados.

Depois disso o token é criado com esse trecho de código, onde por ser um exemplo simples,
não é adicionado nenhum header, o secret que é a chave é passada no segundo parametro e
então enviado como subject (que é a informação que possívelmente seria utilizado obtido do token) e setado para o token expirar em 24h (que é o padrão utilizado em apis sem informação crítica).

``` js
const token = sign({}, secret, {
      subject: login,
      expiresIn: '1d'
  });
```

Com isso o token é gerado e devolvido ao cliente para que seja utilizado como forma de autenticação
nos processos de sua aplicação.

### Exemplo de funcionamento

Fluxograma de funcionamento do exemplo:

<img src="https://i.ibb.co/XShdmxB/trabalho-seguran-a-01.jpg" alt="trabalho-seguran-a-01" border="0">

### Exemplo de uso do token gerado

- Em desenvolvimento web, tanto na parte do frontend quanto backend, utiliza-se muito o jwt para realizar a validação de sessões, no caso, é utilizado para autenticar o usuário que está acessando uma determinada funcionalidade, permitindo ou não, que o mesmo prossiga com a ação. Uma vez que, é possível controlar o tempo de duração do token, consegue-se então ter controle do tempo em que o usuário permanecerá utilizando a aplicação, a partir daquela autenticação.
