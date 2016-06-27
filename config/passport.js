var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../app/models/user');
var configAuth = require('./auth');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        process.nextTick(function () {
            User.findOne({'local.email': email}, function (err, user) {
                if (err) return done(err);

                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    var newUser = new User();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.save(function (err) {
                        if (err) throw err;
                        return done(null, newUser);
                    });
                }
            })
        })
    }));

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        User.findOne({'local.email': email}, function (err, user) {
            if (err) return done(err);

            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.'));

            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Wrong password.'));

            return done(null, user);
        })
    }));

    passport.use(new GoogleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true

    }, function (req, token, refreshToken, profile, done) {
        process.nextTick(function () {

            // is user logged in?
            if (!req.user) {
                // find user based on google id
                User.findOne({'google.id': profile.id}, function (err, user) {
                    if (err) return done(err);

                    // the user was found
                    if (user) {
                        // a user id exists but with no auth token
                        if (!user.google.token) {
                            // so overwrite their stored info and save it
                            user.google.token = token;
                            user.google.name = profile.displayName;
                            user.google.email = profile.emails[0].value;
                            user.save(function (err) {
                                if (err) throw err;
                                return done(null, user);
                            });
                        }
                        return done(null, user);

                    } else {
                        // no user found with given google id
                        var user = new User();
                        // so set all required google info in profile
                        user.google.id = profile.id;
                        user.google.token = token;
                        user.google.name = profile.displayName;
                        user.google.email = profile.emails[0].value;
                        // save user info
                        user.save(function (err) {
                            if (err) throw err;
                            return done(null, user);
                        })
                    }
                })

            } else {
                // user exists and is logged in
                var user = req.user;
                // update current google profile info
                user.google.id = profile.id;
                user.google.token = token;
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value;
                // save user info
                user.save(function (err) {
                    if (err) throw err;
                    return done(null, user);
                })
            }
        })
    }))
}
