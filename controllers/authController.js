const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.registerGet=(req, res) => {
    res.render("register");
};

exports.registerPost = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.send("Passwords do not match ");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email already registered ");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.render("success");
  } catch (err) {
    console.log(err);
    res.send("Error registering user");
  }
};

exports.loginGet = (req, res) => {
  res.render("login");
};

exports.loginPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", { error: "Invalid email or password" });
    }

    req.session.user = user;
    res.redirect("/chat");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Something went wrong. Please try again." });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send("Error logging out");
    }

    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};