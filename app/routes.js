module.exports = function (app, passport) {
    app.all('*', function (req, res, next) {
        res.locals.isAuthenticated = false
        if (req.isAuthenticated()) {
            res.locals.isAuthenticated = true;
            res.locals.user = req.user;
        }
        next();
    });

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.get('/login', function (req, res) {
        res.render('login', {message: req.flash('loginMessage')});
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/signup', function (req, res) {
        res.render('signup', {message: req.flash('signupMessage')});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    app.get('/profile', requireUser, function (req, res) {
        res.render('profile', {
            user: req.user
        });
    })

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // google authentication

    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    // authorize-local

    app.get('/connect/local', function (req, res) {
        res.render('connect-local', {message: req.flash('loginMessage')});
    });

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // authorize-google

    app.get('/connect/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    app.get('/connect/google/callback', passport.authorize('google', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    // unlink accounts

    app.get('/unlink/local', function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    })

    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    })

    // helpers

    function requireUser(req, res, next) {
        if (req.isAuthenticated()) return next();
        res.redirect('/');
    }
}
