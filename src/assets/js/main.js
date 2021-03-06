Zepto(function($){
  window.nearInitPromise = InitContract()
    .then(init)
    .catch(console.error);

  // Initializing contract
  async function InitContract() {
    console.log('nearConfig', nearConfig);

    // Initializing connection to the NEAR DevNet.
    window.near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));

    // Initializing Wallet based Account. It can work with NEAR DevNet wallet that
    // is hosted at https://wallet.nearprotocol.com
    window.walletAccount = new nearlib.WalletAccount(window.near);

    // Getting the Account ID. If unauthorized yet, it's just empty string.
    window.accountId = window.walletAccount.getAccountId();
    let acct = await new nearlib.Account(window.near.connection, window.accountId);

    // Initializing our contract APIs by contract name and configuration.
    window.contract = await new nearlib.Contract(acct, nearConfig.contractName, {
      viewMethods: [
        'getRecentPosts',
        'getPost',
        'getPostByUser',
        'userOf'
      ],
      changeMethods: [
        'setPost',
        'setPostByUser',
        'addPost'
      ],
      sender: window.accountId,
    });
  }

  // Using initialized contract
  async function init() {
    if (!window.walletAccount.isSignedIn()) {
      signedOutFlow();
    } else {
      signedInFlow();
      refreshPosts();
    }
  }

  // Sighted Out Flow
  function signedOutFlow() {
    $('.sign-in-button').removeClass('d-none');
    $('.intro').removeClass('d-none');
    $('#fake-data').removeClass('d-none');
    $('.sign-in-button').removeClass('d-none');
    
    $('.sign-in-button').on('click', function(e) {
      window.walletAccount.requestSignIn(
        window.nearConfig.contractName,
        'NEAR Social'
      );
    });
  }

  // Signed In Flow
  function signedInFlow() {
    $('#username').html('loading');
    $('.sign-out-button').removeClass('d-none');
    $('.input').removeClass('d-none');
    $('#refresh-button').removeClass('d-none');
    // Render current username
    var username = window.accountId;
    $('#username').html(username);

    $('.sign-out-button').on('click', function(e) {
      walletAccount.signOut();
      window.location.replace(window.location.origin + window.location.pathname);
    });

    $('#input-button').click(submitPost);
    $('#input-title').keypress(function (e) {
      if (e.which == 13) {
        e.preventDefault();
        submitPost();
        return false;
      }
    });
    $('#refresh-button').click(refreshPosts);
  }

  // Submit Post Flow
  function submitPost() {
    let title = $('#input-title').val();
    let content = ''; // TODO: Add Content string
    let date = new Date();
    let published_at = date.getTime();
    let type = 'text' // TODO: Add more Type string
  
    $('#input-title').addClass('disabled');
    // Call the addPost contract
    contract.addPost({title: title, content: content, published_at: published_at, type: type})
      .then(() => {
        $('#input-title').val('').removeClass('disabled');
        setTimeout(() => {
          refreshPosts();
        }, 1000);
      })
      .catch(console.error);
  }

  // Loading Posts
  function refreshPosts() {
    // Call the getPost contract
    contract.getRecentPosts()
      .then(renderPosts)
      .catch(console.log);
  }

  // Render Posts
  function renderPosts(posts) {
    let html = '';
    for (let i = posts.posts.length - 1; i >= 0; --i) {
      let date = timeConverter(posts.posts[i].published_at);
      html += '<div class="nearpost-item">';
      html += '<div class="post-date">' + date + '</div>';
      html += '<div class="post-title">' + posts.posts[i].title + '</div>';
      html += '<div class="post-user">' + posts.posts[i].user + '</div>';
      html += '<div class="post-action"></div>';
      html += '</div>';
    }
    console.log(posts);
    $('#posts').empty().append(html);
  }

  // Date and Time
  function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = month + ' ' + date + ', ' + year + ' ' + hour + ':' + min ;
    return UNIX_timestamp; // TODO: return time;
  }
})