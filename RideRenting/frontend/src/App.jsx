import { useEffect, useState } from "react";
import { api } from "./api";
import Antigravity from "./Antigravity";

const IntroVideo = ({ onVideoEnd }) => {
  return (
    <div className="video-overlay">
      <video
        autoPlay
        muted
        playsInline
        onEnded={onVideoEnd}
        className="intro-video"
      >
        {/* Put intro.mp4 in the 'public' folder of the frontend */}
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      <button className="skip-video-btn" onClick={onVideoEnd}>Skip</button>
    </div>
  );
};


const initialRegisterForm = {
  username: "",
  fullName: "",
  email: "",
  password: "",
  role: "USER",
  phoneNumber: "",
};

const initialBikeForm = {
  brand: "",
  model: "",
  registrationNumber: "",
  engineCapacityCc: 150,
  hourlyRate: 5,
  description: "",
  location: "",
};

const initialRentalForm = {
  bikeId: "",
  hoursBooked: 1,
  pickupTime: "",
};

const initialRideShareForm = {
  currentLocation: "",
  destination: "",
};

const rideShareStorageKey = "ride-share-requests";
const driverAvailabilityStorageKey = "driver-availability";

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [showVideoIntro, setShowVideoIntro] = useState(true);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("ride-renting-user");
    return stored ? JSON.parse(stored) : null;
  });
  const [bikes, setBikes] = useState([]);
  const [ownerBikes, setOwnerBikes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bikeForm, setBikeForm] = useState(initialBikeForm);
  const [bikeImageFile, setBikeImageFile] = useState(null);
  const [bikeImagePreview, setBikeImagePreview] = useState("");
  const [editingBike, setEditingBike] = useState(null);
  const [editBikeForm, setEditBikeForm] = useState(initialBikeForm);
  const [editBikeImageFile, setEditBikeImageFile] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [rentalForm, setRentalForm] = useState(initialRentalForm);
  const [editingRentalId, setEditingRentalId] = useState(null);
  const [editRentalForm, setEditRentalForm] = useState({ hoursBooked: 1, pickupTime: "" });
  const [slipState, setSlipState] = useState({});
  const [userView, setUserView] = useState("renting");
  const [rideShareRequests, setRideShareRequests] = useState(() => {
    const stored = localStorage.getItem(rideShareStorageKey);
    return stored ? JSON.parse(stored) : [];
  });
  const [driverAvailability, setDriverAvailability] = useState(() => {
    const stored = localStorage.getItem(driverAvailabilityStorageKey);
    return stored ? JSON.parse(stored) : {};
  });
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [rideShareForm, setRideShareForm] = useState(initialRideShareForm);
  const [driverFeeDrafts, setDriverFeeDrafts] = useState({});
  const [feedback, setFeedback] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "", phoneNumber: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    loadBikes();
    loadAllReviews();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    localStorage.setItem("ride-renting-user", JSON.stringify(currentUser));
    hydrateRoleData(currentUser);
    loadUserReviews(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (!bikeImageFile) {
      setBikeImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(bikeImageFile);
    setBikeImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [bikeImageFile]);

  useEffect(() => {
    localStorage.setItem(rideShareStorageKey, JSON.stringify(rideShareRequests));
  }, [rideShareRequests]);

  useEffect(() => {
    localStorage.setItem(driverAvailabilityStorageKey, JSON.stringify(driverAvailability));
  }, [driverAvailability]);

  async function hydrateRoleData(user) {
    try {
      if (user.role === "OWNER") {
        setOwnerBikes(await api.getOwnerBikes(user.id));
        setRentals(await api.getOwnerRentals(user.id));
      } else if (user.role === "USER") {
        setRentals(await api.getUserRentals(user.id));
        const users = await api.getUsers();
        setDrivers(
          users
            .filter((entry) => entry.role === "DRIVER" && entry.active)
            .map((entry) => ({
              ...entry,
              availability: driverAvailability[entry.id] || "AVAILABLE",
            }))
        );
      } else if (user.role === "ADMIN") {
        setDashboard(await api.getDashboard());
        setRentals(await api.getAllRentals());
      } else if (user.role === "DRIVER") {
        const allRentals = await api.getAllRentals();
        setRentals(allRentals.filter((rental) => rental.slipUploadedBy === "DRIVER"));
      }
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function loadBikes() {
    try {
      setBikes(await api.getBikes());
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    try {
      const result = await api.register(registerForm);
      setFeedback(result.message);
      setRegisterForm(initialRegisterForm);
      setAuthMode("login");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const result = await api.login(loginForm);
      setCurrentUser(result.user);
      setFeedback(`${result.message} as ${result.user.role}`);
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleCreateBike(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    if (!bikeImageFile) {
      setFeedback("Choose a bike image before publishing");
      return;
    }
    try {
      await api.createBike({
        ...bikeForm,
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        engineCapacityCc: Number(bikeForm.engineCapacityCc),
        hourlyRate: Number(bikeForm.hourlyRate),
      }, bikeImageFile);
      setBikeForm(initialBikeForm);
      setBikeImageFile(null);
      setBikeImagePreview("");
      setOwnerBikes(await api.getOwnerBikes(currentUser.id));
      await loadBikes();
      setFeedback("Bike listed successfully");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleUpdateBike(event) {
    event.preventDefault();
    if (!currentUser || !editingBike) {
      return;
    }
    try {
      await api.updateBike(editingBike.id, {
        ownerId: currentUser.id,
        brand: editBikeForm.brand,
        model: editBikeForm.model,
        engineCapacityCc: Number(editBikeForm.engineCapacityCc),
        hourlyRate: Number(editBikeForm.hourlyRate),
        description: editBikeForm.description,
        location: editBikeForm.location,
      }, editBikeImageFile);
      setEditingBike(null);
      setEditBikeImageFile(null);
      setFeedback("Bike updated successfully");
      setOwnerBikes(await api.getOwnerBikes(currentUser.id));
      await loadBikes();
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function openEditBike(bike) {
    setEditingBike(bike);
    setEditBikeForm({
      brand: bike.brand || "",
      model: bike.model || "",
      registrationNumber: bike.registrationNumber || "",
      engineCapacityCc: bike.engineCapacityCc || 150,
      hourlyRate: bike.hourlyRate || 5,
      description: bike.description || "",
      location: bike.location || "",
    });
    setEditBikeImageFile(null);
  }

  async function handleDeleteBike(bikeId) {
    if (!currentUser) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this bike?")) {
      return;
    }
    try {
      await api.deleteBike(bikeId, currentUser.id);
      setOwnerBikes(await api.getOwnerBikes(currentUser.id));
      await loadBikes();
      setFeedback("Bike deleted successfully");
      if (editingBike?.id === bikeId) {
        setEditingBike(null);
      }
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function handleCancelEdit() {
    setEditingBike(null);
    setEditBikeForm(initialBikeForm);
    setEditBikeImageFile(null);
  }

  async function handleRentBike(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      await api.createRental({
        bikeId: Number(rentalForm.bikeId),
        userId: currentUser.id,
        userName: currentUser.fullName,
        hoursBooked: Number(rentalForm.hoursBooked),
        pickupTime: rentalForm.pickupTime,
      });
      setRentalForm(initialRentalForm);
      setRentals(await api.getUserRentals(currentUser.id));
      await loadBikes();
      setFeedback("Rental request created. Upload the payment slip next.");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function handleStartEditRental(rental) {
    setEditingRentalId(rental.id);
    setEditRentalForm({
      hoursBooked: rental.hoursBooked || 1,
      pickupTime: rental.pickupTime ? rental.pickupTime.slice(0, 16) : "",
    });
  }

  function handleCancelEditRental() {
    setEditingRentalId(null);
    setEditRentalForm({ hoursBooked: 1, pickupTime: "" });
  }

  async function handleUpdateRental(event, rentalId) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      await api.updateRental(rentalId, {
        hoursBooked: Number(editRentalForm.hoursBooked),
        pickupTime: editRentalForm.pickupTime,
      });
      await hydrateRoleData(currentUser);
      setFeedback("Rental updated successfully");
      handleCancelEditRental();
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleDeleteRental(rentalId) {
    if (!currentUser) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this rental?")) {
      return;
    }
    try {
      await api.deleteRental(rentalId);
      await hydrateRoleData(currentUser);
      await loadBikes();
      setFeedback("Rental deleted successfully");
      if (editingRentalId === rentalId) {
        handleCancelEditRental();
      }
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleUploadSlip(rentalId) {
    const slip = slipState[rentalId];
    if (!slip?.file || !currentUser) {
      setFeedback("Choose a payment slip file first");
      return;
    }
    try {
      await api.uploadSlip(
        rentalId,
        currentUser.role,
        slip.paymentReference || "MANUAL-REF",
        slip.notes || "",
        slip.file,
      );
      await hydrateRoleData(currentUser);
      setFeedback("Payment slip uploaded");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleRentalStatus(rentalId, status) {
    try {
      await api.updateRentalStatus(rentalId, status, `${status} by ${currentUser.role}`);
      await hydrateRoleData(currentUser);
      await loadBikes();
      setFeedback(`Rental ${status.toLowerCase()}`);
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleDeleteSlip(rentalId) {
    if (!currentUser) {
      return;
    }
    try {
      await api.deleteSlip(rentalId);
      setSlipState((current) => {
        const next = { ...current };
        delete next[rentalId];
        return next;
      });
      await hydrateRoleData(currentUser);
      setFeedback("Payment slip deleted");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function handleRideShareRequestSubmit(event) {
    event.preventDefault();
    if (!currentUser || !selectedDriverId) {
      return;
    }

    const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId);
    if (!selectedDriver) {
      setFeedback("Select a driver before sending a request");
      return;
    }
    if (!rideShareForm.currentLocation.trim() || !rideShareForm.destination.trim()) {
      setFeedback("Enter current location and destination");
      return;
    }

    const request = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      driverId: selectedDriver.id,
      driverName: selectedDriver.fullName,
      currentLocation: rideShareForm.currentLocation.trim(),
      destination: rideShareForm.destination.trim(),
      status: "PENDING",
      fee: null,
      paymentMethod: "CASH",
      paymentReference: null,
      slipOriginalFileName: null,
      slipContentType: null,
      slipDataUrl: null,
    };

    setRideShareRequests((current) => [request, ...current]);
    setRideShareForm(initialRideShareForm);
    setSelectedDriverId(null);
    setFeedback(`Request sent to ${selectedDriver.fullName}`);
  }

  function handleDriverApproval(requestId) {
    const fee = driverFeeDrafts[requestId]?.trim();
    if (!fee) {
      setFeedback("Enter the fee before approving the request");
      return;
    }

    const targetRequest = rideShareRequests.find((request) => request.id === requestId);
    if (!targetRequest) {
      return;
    }

    setRideShareRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: "APPROVED", fee }
          : request
      )
    );
    setDriverFeeDrafts((current) => ({ ...current, [requestId]: "" }));
    setFeedback(`Approved request for ${targetRequest.userName}`);
  }

  async function handleUploadRideShareSlip(requestId, file, paymentMethod = "SLIP_UPLOAD") {
    if (!file) {
      setRideShareRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                paymentMethod,
                paymentReference: paymentMethod === "CASH" ? null : request.paymentReference,
                slipOriginalFileName: paymentMethod === "CASH" ? null : request.slipOriginalFileName,
                slipContentType: paymentMethod === "CASH" ? null : request.slipContentType,
                slipDataUrl: paymentMethod === "CASH" ? null : request.slipDataUrl,
              }
            : request
        )
      );
      if (paymentMethod === "CASH") {
        setFeedback("Ride sharing payment method set to cash");
      }
      return;
    }

    try {
      const slipDataUrl = await readFileAsDataUrl(file);
      setRideShareRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                paymentMethod: "SLIP_UPLOAD",
                paymentReference: `SHARE-${requestId}`,
                slipOriginalFileName: file.name,
                slipContentType: file.type,
                slipDataUrl,
              }
            : request
        )
      );
      setFeedback("Ride sharing payment slip uploaded");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function handleDeleteRideShareSlip(requestId) {
    setRideShareRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              paymentMethod: "CASH",
              paymentReference: null,
              slipOriginalFileName: null,
              slipContentType: null,
              slipDataUrl: null,
            }
          : request
      )
    );
    setFeedback("Ride sharing payment slip deleted");
  }

  function handleDriverAvailabilityChange(status) {
    if (!currentUser || currentUser.role !== "DRIVER") {
      return;
    }

    setDriverAvailability((current) => ({
      ...current,
      [currentUser.id]: status,
    }));
    setFeedback(`Driver marked as ${status.toLowerCase()}`);
  }

  function logout() {
    setCurrentUser(null);
    setRentals([]);
    setOwnerBikes([]);
    setDrivers([]);
    setDashboard(null);
    setUserView("renting");
    setSelectedDriverId(null);
    setRideShareForm(initialRideShareForm);
    localStorage.removeItem("ride-renting-user");
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    try {
      const result = await api.updateProfile(currentUser.id, profileForm);
      setCurrentUser(result.user);
      setShowProfileModal(false);
      setFeedback("Profile updated successfully");
      setProfileForm({ fullName: "", email: "", phoneNumber: "" });
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleDeleteProfile(event) {
    event.preventDefault();
    if (!currentUser || !deletePassword.trim()) {
      setFeedback("Enter your password to delete profile");
      return;
    }
    try {
      await api.deleteProfile(currentUser.id, { password: deletePassword });
      logout();
      setFeedback("Profile deleted successfully");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function openProfileModal() {
    if (currentUser) {
      setProfileForm({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
      });
      setShowProfileModal(true);
    }
  }

  async function loadAllReviews() {
    try {
      setReviews(await api.getAllReviews());
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function loadUserReviews(userId) {
    try {
      setUserReviews(await api.getUserReviews(userId));
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleCreateOrUpdateReview(event) {
    event.preventDefault();
    if (!currentUser || !reviewForm.comment.trim()) {
      setFeedback("Please enter a review comment");
      return;
    }

    try {
      if (editingReviewId) {
        await api.updateReview(editingReviewId, currentUser.id, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
        setFeedback("Review updated successfully");
      } else {
        await api.createReview(currentUser.id, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
        setFeedback("Review added successfully");
      }
      setReviewForm({ rating: 5, comment: "" });
      setEditingReviewId(null);
      await loadUserReviews(currentUser.id);
      await loadAllReviews();
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!currentUser || !confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await api.deleteReview(reviewId, currentUser.id);
      setFeedback("Review deleted successfully");
      await loadUserReviews(currentUser.id);
      await loadAllReviews();
    } catch (error) {
      setFeedback(error.message);
    }
  }

  function startEditReview(review) {
    setEditingReviewId(review.id);
    setReviewForm({ rating: review.rating, comment: review.comment });
  }

  function cancelEditReview() {
    setEditingReviewId(null);
    setReviewForm({ rating: 5, comment: "" });
  }

  if (showVideoIntro) {
    return <IntroVideo onVideoEnd={() => setShowVideoIntro(false)} />;
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="bike-road">
          <img src="/bike.png" alt="Urban Moves" className="nav-logo" />
          <div className="road-line"></div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-antigravity">
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color={'#4a7cff'}
            autoAnimate={true}
            particleVariance={1}
          />
        </div>
        <div className="hero-content">
          <p className="eyebrow">Urban Moves</p>
          <h1>Ride &amp; Rent</h1>
          <p className="lede">
            Users rent by the hour, owners publish bikes, drivers and admins help validate payment slips
          </p>
        </div>
        <div className="hero-card">
          <span>Default admin login</span>
          <strong>admin / Admin@123</strong>
          <p></p>
        </div>
      </header>

      <main className="grid">
        <section className="panel auth-panel">
          <div className="tab-row">
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
              Login
            </button>
            <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
              Register
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="form-grid">
              <label>
                Username
                <input value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              </label>
              <label>
                Password
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              </label>
              <button type="submit">Sign in</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="form-grid">
              <label>
                Username
                <input value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} />
              </label>
              <label>
                Full name
                <input value={registerForm.fullName} onChange={(event) => setRegisterForm({ ...registerForm, fullName: event.target.value })} />
              </label>
              <label>
                Email
                <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
              </label>
              <label>
                Password
                <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
              </label>
              <label>
                Phone
                <input value={registerForm.phoneNumber} onChange={(event) => setRegisterForm({ ...registerForm, phoneNumber: event.target.value })} />
              </label>
              <label>
                Role
                <select value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                  <option value="USER">User</option>
                  <option value="OWNER">Owner</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </label>
              <button type="submit">Create account</button>
            </form>
          )}

          {currentUser ? (
            <div className="session-card">
              <div className="profile-header">
                <p>Your Profile</p>
                <strong>{currentUser.fullName}</strong>
                <span className="profile-role">{currentUser.role}</span>
              </div>
              
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Role</span>
                  <span className="detail-value role-value">{currentUser.role}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">{currentUser.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{currentUser.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{currentUser.phoneNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value">{currentUser.active ? "Active" : "Inactive"}</span>
                </div>
              </div>
              
              <div className="session-card-buttons">
                <button onClick={openProfileModal}>Edit Profile</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="delete-btn">Delete Profile</button>
                <button onClick={logout}>Logout</button>
              </div>
            </div>
          ) : null}

          {feedback ? <p className="feedback">{feedback}</p> : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Available Bikes</h2>
            <button onClick={loadBikes}>Refresh</button>
          </div>
          <div className="bike-grid">
            {bikes.map((bike) => (
              <article key={bike.id} className="bike-card">
                <div className="bike-image-frame">
                  <img src={bike.imageUrl} alt={`${bike.brand} ${bike.model}`} />
                </div>
                <div>
                  <h3>{bike.brand} {bike.model}</h3>
                  <p>{bike.description}</p>
                </div>
                <dl>
                  <div><dt>Location</dt><dd>{bike.location}</dd></div>
                  <div><dt>Rate</dt><dd>${bike.hourlyRate}/hr</dd></div>
                  <div><dt>Owner</dt><dd>{bike.ownerName}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>User Reviews & Feedback</h2>
            <button onClick={loadAllReviews}>Refresh</button>
          </div>
          <div className="reviews-container">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-header">
                    <div>
                      <strong>{review.userName}</strong>
                      <span className="review-role">{review.userRole}</span>
                    </div>
                    <div className="review-rating">
                      {"⭐".repeat(review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </article>
              ))
            ) : (
              <p className="empty-state">No reviews yet. Be the first to share your feedback!</p>
            )}
          </div>
        </section>

        {currentUser?.role === "USER" ? (
          <>
            <section className="panel">
              <div className="mode-switch">
                <button
                  className={userView === "renting" ? "active" : ""}
                  onClick={() => setUserView("renting")}
                >
                  Ride Renting
                </button>
                <button
                  className={userView === "sharing" ? "active" : ""}
                  onClick={() => setUserView("sharing")}
                >
                  Ride Sharing
                </button>
              </div>
            </section>

            {userView === "renting" ? (
              <>
            <section className="panel">
              <h2>Rent a Bike</h2>
              <form onSubmit={handleRentBike} className="form-grid">
                <label>
                  Bike
                  <select value={rentalForm.bikeId} onChange={(event) => setRentalForm({ ...rentalForm, bikeId: event.target.value })}>
                    <option value="">Select a bike</option>
                    {bikes.map((bike) => (
                      <option key={bike.id} value={bike.id}>
                        {bike.brand} {bike.model} - ${bike.hourlyRate}/hr
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Hours
                  <input type="number" min="1" value={rentalForm.hoursBooked} onChange={(event) => setRentalForm({ ...rentalForm, hoursBooked: event.target.value })} />
                </label>
                <label>
                  Pickup time
                  <input type="datetime-local" value={rentalForm.pickupTime} onChange={(event) => setRentalForm({ ...rentalForm, pickupTime: event.target.value })} />
                </label>
                <button type="submit">Create rental</button>
              </form>
            </section>

            <section className="panel">
              <h2>My Rentals</h2>
              <RentalList
                rentals={rentals}
                currentUser={currentUser}
                slipState={slipState}
                setSlipState={setSlipState}
                onUploadSlip={handleUploadSlip}
                onDeleteSlip={handleDeleteSlip}
                onStartEditRental={handleStartEditRental}
                onCancelEditRental={handleCancelEditRental}
                onUpdateRental={handleUpdateRental}
                onDeleteRental={handleDeleteRental}
                editingRentalId={editingRentalId}
                editRentalForm={editRentalForm}
                setEditRentalForm={setEditRentalForm}
              />
            </section>
              </>
            ) : (
              <>
                <section className="panel">
                  <div className="section-heading">
                    <h2>Available Drivers</h2>
                    <span className="driver-count">{drivers.length} listed</span>
                  </div>
                  {drivers.length ? (
                    <div className="driver-grid">
                      {drivers.map((driver) => (
                        <article key={driver.id} className="driver-card">
                          <div className="driver-avatar">
                            {driver.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3>{driver.fullName}</h3>
                            <p>@{driver.username}</p>
                          </div>
                          <dl>
                            <div><dt>Email</dt><dd>{driver.email}</dd></div>
                            <div><dt>Phone</dt><dd>{driver.phoneNumber}</dd></div>
                            <div><dt>Status</dt><dd>{formatAvailability(driver.availability)}</dd></div>
                          </dl>
                          <button
                            type="button"
                            disabled={driver.availability !== "AVAILABLE"}
                            onClick={() => setSelectedDriverId(driver.id)}
                          >
                            {driver.availability === "AVAILABLE" ? "Request Driver" : "Unavailable"}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No drivers are available right now.</p>
                  )}
                </section>

                <section className="panel">
                  <h2>Ride Sharing Request</h2>
                  {selectedDriverId ? (
                    <form onSubmit={handleRideShareRequestSubmit} className="form-grid">
                      <p className="selected-driver">
                        Sending request to {drivers.find((driver) => driver.id === selectedDriverId)?.fullName}
                      </p>
                      <label>
                        Current Location
                        <input
                          value={rideShareForm.currentLocation}
                          onChange={(event) => setRideShareForm({ ...rideShareForm, currentLocation: event.target.value })}
                        />
                      </label>
                      <label>
                        Destination
                        <input
                          value={rideShareForm.destination}
                          onChange={(event) => setRideShareForm({ ...rideShareForm, destination: event.target.value })}
                        />
                      </label>
                      <div className="action-row">
                        <button type="submit">Send Request</button>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => {
                            setSelectedDriverId(null);
                            setRideShareForm(initialRideShareForm);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="empty-state">Choose a driver to open the request form.</p>
                  )}
                </section>

                <section className="panel">
                  <h2>My Ride Sharing Requests</h2>
                  <RideShareRequestList
                    requests={rideShareRequests.filter((request) => request.userId === currentUser.id)}
                    currentUser={currentUser}
                    onUploadSlip={handleUploadRideShareSlip}
                    onDeleteSlip={handleDeleteRideShareSlip}
                  />
                </section>
              </>
            )}
          </>
        ) : null}

        {currentUser?.role === "OWNER" ? (
          <>
            <section className="panel">
              <h2>List a Motor Bicycle</h2>
              <form onSubmit={handleCreateBike} className="form-grid">
                <label>
                  Brand
                  <input value={bikeForm.brand} onChange={(event) => setBikeForm({ ...bikeForm, brand: event.target.value })} />
                </label>
                <label>
                  Model
                  <input value={bikeForm.model} onChange={(event) => setBikeForm({ ...bikeForm, model: event.target.value })} />
                </label>
                <label>
                  Registration Number
                  <input value={bikeForm.registrationNumber} onChange={(event) => setBikeForm({ ...bikeForm, registrationNumber: event.target.value })} />
                </label>
                <label>
                  Engine Capacity Cc
                  <input type="number" min="50" value={bikeForm.engineCapacityCc} onChange={(event) => setBikeForm({ ...bikeForm, engineCapacityCc: event.target.value })} />
                </label>
                <label>
                  Hourly Rate
                  <input type="number" min="0.01" step="0.01" value={bikeForm.hourlyRate} onChange={(event) => setBikeForm({ ...bikeForm, hourlyRate: event.target.value })} />
                </label>
                <label>
                  Description
                  <textarea value={bikeForm.description} onChange={(event) => setBikeForm({ ...bikeForm, description: event.target.value })} />
                </label>
                <label>
                  Location
                  <input value={bikeForm.location} onChange={(event) => setBikeForm({ ...bikeForm, location: event.target.value })} />
                </label>
                <label>
                  Bike Image
                  <div className="upload-box">
                    {bikeImagePreview ? (
                      <img className="upload-preview" src={bikeImagePreview} alt="Selected bike" />
                    ) : (
                      <div className="upload-empty">
                        <strong>Upload bike image</strong>
                        <span>PNG, JPG or WEBP</span>
                      </div>
                    )}
                    <input
                      className="upload-input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setBikeImageFile(event.target.files?.[0] || null)}
                    />
                  </div>
                </label>
                {bikeImageFile ? <p className="file-hint">{bikeImageFile.name}</p> : null}
                <button type="submit">Publish bike</button>
              </form>
            </section>

            <section className="panel">
              <h2>Owner Inventory</h2>
              {ownerBikes.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Registration Number</th>
                        <th>Hourly Rate</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerBikes.map((bike) => (
                        <tr key={bike.id}>
                          <td>{bike.brand}</td>
                          <td>{bike.model}</td>
                          <td>{bike.registrationNumber}</td>
                          <td>{bike.hourlyRate}</td>
                          <td>{bike.status}</td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="ghost" onClick={() => openEditBike(bike)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDeleteBike(bike.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">You have no bikes listed yet.</p>
              )}
            </section>

            {editingBike ? (
              <section className="panel">
                <h2>Edit Bike</h2>
                <form onSubmit={handleUpdateBike} className="form-grid">
                  <label>
                    Brand
                    <input
                      value={editBikeForm.brand}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, brand: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Model
                    <input
                      value={editBikeForm.model}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, model: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Engine Capacity Cc
                    <input
                      type="number"
                      min="50"
                      value={editBikeForm.engineCapacityCc}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, engineCapacityCc: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Hourly Rate
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editBikeForm.hourlyRate}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, hourlyRate: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      value={editBikeForm.description}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, description: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={editBikeForm.location}
                      onChange={(event) =>
                        setEditBikeForm({ ...editBikeForm, location: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Replace Image
                    <div className="upload-box">
                      <div className="upload-empty">
                        <strong>Choose a new image</strong>
                        <span>Optional</span>
                      </div>
                      <input
                        className="upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setEditBikeImageFile(event.target.files?.[0] || null)}
                      />
                    </div>
                  </label>
                  {editBikeImageFile ? <p className="file-hint">{editBikeImageFile.name}</p> : null}
                  <div className="button-row">
                    <button type="submit">Save changes</button>
                    <button type="button" onClick={handleCancelEdit} className="secondary-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <section className="panel">
              <h2>Owner Rental Queue</h2>
              <RentalList
                rentals={rentals}
                currentUser={currentUser}
                slipState={slipState}
                setSlipState={setSlipState}
                onUploadSlip={handleUploadSlip}
                onDeleteSlip={handleDeleteSlip}
                onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
                onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
                onStartEditRental={handleStartEditRental}
                onCancelEditRental={handleCancelEditRental}
                onUpdateRental={handleUpdateRental}
                onDeleteRental={handleDeleteRental}
                editingRentalId={editingRentalId}
                editRentalForm={editRentalForm}
                setEditRentalForm={setEditRentalForm}
              />
            </section>
          </>
        ) : null}

        {currentUser?.role === "DRIVER" ? (
          <>
            <section className="panel">
              <h2>Driver Availability</h2>
              <div className="availability-switch">
                <button
                  className={(driverAvailability[currentUser.id] || "AVAILABLE") === "AVAILABLE" ? "active" : ""}
                  onClick={() => handleDriverAvailabilityChange("AVAILABLE")}
                >
                  Available
                </button>
                <button
                  className={(driverAvailability[currentUser.id] || "AVAILABLE") === "UNAVAILABLE" ? "active" : ""}
                  onClick={() => handleDriverAvailabilityChange("UNAVAILABLE")}
                >
                  Unavailable
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Ride Share Requests</h2>
              <DriverRideShareQueue
                requests={rideShareRequests.filter((request) => request.driverId === currentUser.id)}
                feeDrafts={driverFeeDrafts}
                setFeeDrafts={setDriverFeeDrafts}
                onApprove={handleDriverApproval}
              />
            </section>

            <section className="panel">
              <h2>Driver Payment Validation</h2>
              <RentalList
                rentals={rentals}
                currentUser={currentUser}
                slipState={slipState}
                setSlipState={setSlipState}
                onUploadSlip={handleUploadSlip}
                onDeleteSlip={handleDeleteSlip}
                onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
                onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
                onStartEditRental={handleStartEditRental}
                onCancelEditRental={handleCancelEditRental}
                onUpdateRental={handleUpdateRental}
                onDeleteRental={handleDeleteRental}
                editingRentalId={editingRentalId}
                editRentalForm={editRentalForm}
                setEditRentalForm={setEditRentalForm}
              />
            </section>
          </>
        ) : null}

        {currentUser?.role === "ADMIN" ? (
          <>
            <section className="panel">
              <h2>Platform Statistics</h2>
              {dashboard ? (
                <div className="stats-grid">
                  <StatCard title="Users" value={dashboard.userCounts.users} />
                  <StatCard title="Owners" value={dashboard.userCounts.owners} />
                  <StatCard title="Drivers" value={dashboard.userCounts.drivers} />
                  <StatCard title="Bikes" value={dashboard.bikeCounts.total} />
                  <StatCard title="Pending Payments" value={dashboard.rentalCounts.pendingPayments} />
                  <StatCard title="Revenue" value={`$${dashboard.revenue}`} />
                </div>
              ) : null}
            </section>

            <section className="panel">
              <h2>Admin Rental Oversight</h2>
              <RentalList
                rentals={rentals}
                currentUser={currentUser}
                slipState={slipState}
                setSlipState={setSlipState}
                onUploadSlip={handleUploadSlip}
                onDeleteSlip={handleDeleteSlip}
                onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
                onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
                onComplete={(rentalId) => handleRentalStatus(rentalId, "COMPLETED")}
                onStartEditRental={handleStartEditRental}
                onCancelEditRental={handleCancelEditRental}
                onUpdateRental={handleUpdateRental}
                onDeleteRental={handleDeleteRental}
                editingRentalId={editingRentalId}
                editRentalForm={editRentalForm}
                setEditRentalForm={setEditRentalForm}
              />
            </section>

            <section className="panel">
              <h2>Admin Ride Sharing Oversight</h2>
              <RideShareRequestList
                requests={rideShareRequests}
                currentUser={currentUser}
                onUploadSlip={handleUploadRideShareSlip}
                onDeleteSlip={handleDeleteRideShareSlip}
              />
            </section>

            <section className="panel">
              <h2>Admin Details</h2>
              {dashboard ? (
                <div className="admin-columns">
                  <SimpleTable columns={["username", "fullName", "email", "role", "phoneNumber"]} rows={dashboard.users} />
                  <SimpleTable columns={["brand", "model", "ownerName", "location", "status"]} rows={dashboard.bikes} />
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {currentUser ? (
          <section className="panel feedback-section">
            <h2>📝 Share Your Feedback</h2>
            <form onSubmit={handleCreateOrUpdateReview} className="form-grid">
              <label>
                Rating
                <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: parseInt(event.target.value) })}>
                  <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                  <option value="4">⭐⭐⭐⭐ - Very Good</option>
                  <option value="3">⭐⭐⭐ - Good</option>
                  <option value="2">⭐⭐ - Fair</option>
                  <option value="1">⭐ - Poor</option>
                </select>
              </label>
              <label>
                Your Review
                <textarea 
                  value={reviewForm.comment} 
                  onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                  placeholder="Share your experience with our platform..."
                />
              </label>
              <button type="submit">{editingReviewId ? "Update Review" : "Submit Review"}</button>
              {editingReviewId && (
                <button type="button" onClick={cancelEditReview} className="ghost">Cancel</button>
              )}
            </form>

            <div className="user-reviews-section">
              <h3>✨ Your Reviews ({userReviews.length})</h3>
              {userReviews.length > 0 ? (
                userReviews.map((review) => (
                  <article key={review.id} className="user-review-card">
                    <div className="user-review-header">
                      <div className="user-review-rating">
                        {"⭐".repeat(review.rating)}
                      </div>
                      <div className="user-review-actions">
                        <button onClick={() => startEditReview(review)} className="ghost">✎ Edit</button>
                        <button onClick={() => handleDeleteReview(review.id)} className="danger">🗑 Delete</button>
                      </div>
                    </div>
                    <p className="user-review-comment">{review.comment}</p>
                    <span className="user-review-date">
                      {new Date(review.updatedAt).toLocaleDateString()}
                    </span>
                  </article>
                ))
              ) : (
                <p className="empty-state">You haven't shared any reviews yet. Be the first to leave feedback!</p>
              )}
            </div>
          </section>
        ) : null}

        {showProfileModal && currentUser ? (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Update Profile</h2>
                <button className="close-btn" onClick={() => setShowProfileModal(false)}>×</button>
              </div>
              <form onSubmit={handleUpdateProfile} className="form-grid">
                <label>
                  Full Name
                  <input 
                    value={profileForm.fullName}
                    onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input 
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                  />
                </label>
                <label>
                  Phone Number
                  <input 
                    value={profileForm.phoneNumber}
                    onChange={(event) => setProfileForm({ ...profileForm, phoneNumber: event.target.value })}
                  />
                </label>
                <button type="submit">Update Profile</button>
                <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
              </form>
            </div>
          </div>
        ) : null}

        {showDeleteConfirm && currentUser ? (
          <div className="modal-overlay">
            <div className="modal delete-modal">
              <div className="modal-header">
                <h2>Delete Profile</h2>
                <button className="close-btn" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>×</button>
              </div>
              <p className="delete-warning">This action cannot be undone. All your data will be permanently deleted.</p>
              <form onSubmit={handleDeleteProfile} className="form-grid">
                <label>
                  Enter your password to confirm deletion
                  <input 
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder="Your password"
                  />
                </label>
                <button type="submit" className="delete-btn">Delete My Profile</button>
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>Cancel</button>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function RentalList({
  rentals,
  currentUser,
  slipState,
  setSlipState,
  onUploadSlip,
  onDeleteSlip,
  onApprove,
  onReject,
  onComplete,
  onStartEditRental,
  onCancelEditRental,
  onUpdateRental,
  onDeleteRental,
  editingRentalId,
  editRentalForm,
  setEditRentalForm,
}) {
  if (!rentals.length) {
    return <p className="empty-state">No rentals available yet.</p>;
  }

  return (
    <div className="rental-grid">
      {rentals.map((rental) => {
        const isRentalOwner = currentUser.role === "USER" && rental.userId === currentUser.id;
        const canModifyRental = isRentalOwner && ["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "REJECTED"].includes(rental.status);
        const paymentMethod = getRentalPaymentMethod(rental, slipState[rental.id]);
        const showDriverSlipPreview = rental.hasPaymentSlip && (currentUser.role !== "DRIVER" || rental.slipUploadedBy === "DRIVER");

        return (
          <article key={rental.id} className="rental-card">
            <div className="section-heading">
              <div>
                <h3>{rental.bikeName}</h3>
                <p>{rental.userName} • {rental.hoursBooked} hour(s)</p>
              </div>
              <span className={`pill ${rental.status.toLowerCase()}`}>{rental.status}</span>
            </div>
            <p>Total amount: ${rental.totalAmount}</p>
            <p>Pickup: {new Date(rental.pickupTime).toLocaleString()}</p>
            <p>Return: {new Date(rental.returnTime).toLocaleString()}</p>
            <p>Slip uploader: {formatSlipUploader(rental)}</p>
            <p>Slip file: {rental.slipOriginalFileName || "Not uploaded"}</p>

            {isRentalOwner ? (
              <div className="payment-method-box">
                <span className="payment-method-label">Payment Method</span>
                <div className="payment-method-options">
                  <label>
                    <input
                      type="radio"
                      name={`rental-payment-${rental.id}`}
                      checked={paymentMethod === "CASH"}
                      onChange={() =>
                        setSlipState({
                          ...slipState,
                          [rental.id]: { ...slipState[rental.id], paymentMethod: "CASH" },
                        })
                      }
                    />
                    Cash
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`rental-payment-${rental.id}`}
                      checked={paymentMethod === "SLIP_UPLOAD"}
                      onChange={() =>
                        setSlipState({
                          ...slipState,
                          [rental.id]: { ...slipState[rental.id], paymentMethod: "SLIP_UPLOAD" },
                        })
                      }
                    />
                    Slip Upload
                  </label>
                </div>
              </div>
            ) : null}

            {showDriverSlipPreview ? (
              <div className="slip-preview">
                <div className="section-heading">
                  <strong>Uploaded Payment Slip</strong>
                  <a href={api.getSlipUrl(rental.id)} target="_blank" rel="noreferrer">
                    Open full slip
                  </a>
                </div>
                {rental.slipContentType?.startsWith("image/") ? (
                  <img
                    src={api.getSlipUrl(rental.id)}
                    alt={`Payment slip for rental ${rental.id}`}
                  />
                ) : (
                  <p className="empty-state">
                    Preview is not available for {rental.slipContentType || "this file type"}.
                    Open the slip in a new tab.
                  </p>
                )}
              </div>
            ) : null}

            {isRentalOwner ? (
              paymentMethod === "SLIP_UPLOAD" ? (
                <div className="slip-box">
                  <input
                    type="file"
                    onChange={(event) =>
                      setSlipState({
                        ...slipState,
                        [rental.id]: { ...slipState[rental.id], file: event.target.files?.[0] },
                      })
                    }
                  />
                  <input
                    placeholder="Payment reference"
                    value={slipState[rental.id]?.paymentReference || ""}
                    onChange={(event) =>
                      setSlipState({
                        ...slipState,
                        [rental.id]: { ...slipState[rental.id], paymentReference: event.target.value },
                      })
                    }
                  />
                  <textarea
                    placeholder="Notes"
                    value={slipState[rental.id]?.notes || ""}
                    onChange={(event) =>
                      setSlipState({
                        ...slipState,
                        [rental.id]: { ...slipState[rental.id], notes: event.target.value },
                      })
                    }
                  />
                  <button onClick={() => onUploadSlip(rental.id)}>Upload slip as {currentUser.role}</button>
                </div>
              ) : (
                <p className="empty-state">Cash payment selected.</p>
              )
            ) : (
              <p className="empty-state">Slip upload is only available to the booking user.</p>
            )}

            {canModifyRental ? (
              editingRentalId === rental.id ? (
                <form className="edit-rental-form" onSubmit={(event) => onUpdateRental(event, rental.id)}>
                  <label>
                    Hours booked
                    <input
                      type="number"
                      min="1"
                      value={editRentalForm.hoursBooked}
                      onChange={(event) => setEditRentalForm({ ...editRentalForm, hoursBooked: event.target.value })}
                    />
                  </label>
                  <label>
                    Pickup time
                    <input
                      type="datetime-local"
                      value={editRentalForm.pickupTime}
                      onChange={(event) => setEditRentalForm({ ...editRentalForm, pickupTime: event.target.value })}
                    />
                  </label>
                  <div className="edit-actions">
                    <button type="submit">Save changes</button>
                    <button type="button" className="ghost" onClick={onCancelEditRental}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="action-row">
                  <button type="button" onClick={() => onStartEditRental(rental)}>
                    Edit rental
                  </button>
                  <button className="danger" type="button" onClick={() => onDeleteRental(rental.id)}>
                    Delete rental
                  </button>
                </div>
              )
            ) : null}

            <div className="action-row">
              {currentUser.role === "USER" && rental.userId === currentUser.id && rental.hasPaymentSlip ? (
                <button className="danger" type="button" onClick={() => onDeleteSlip(rental.id)}>
                  Delete slip
                </button>
              ) : null}
              {onApprove ? <button onClick={() => onApprove(rental.id)}>Approve</button> : null}
              {onReject ? <button className="ghost" onClick={() => onReject(rental.id)}>Reject</button> : null}
              {onComplete ? <button className="ghost" onClick={() => onComplete(rental.id)}>Complete</button> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RideShareRequestList({ requests, currentUser, onUploadSlip, onDeleteSlip }) {
  if (!requests.length) {
    return <p className="empty-state">No ride sharing requests yet.</p>;
  }

  return (
    <div className="request-grid">
      {requests.map((request) => (
        <article key={request.id} className="request-card">
          <div className="section-heading">
            <strong>{request.driverName}</strong>
            <span className={`pill ${request.status.toLowerCase()}`}>{request.status}</span>
          </div>
          <p>From: {request.currentLocation}</p>
          <p>To: {request.destination}</p>
          {request.status === "APPROVED" ? (
            <p className="approval-message">
              Driver {request.driverName} has approved the request and the fee is {request.fee}
            </p>
          ) : (
            <p className="empty-state">Waiting for driver approval.</p>
          )}
          {currentUser?.role === "USER" && request.userId === currentUser.id && request.status === "APPROVED" ? (
            <div className="payment-method-box">
              <span className="payment-method-label">Payment Method</span>
              <div className="payment-method-options">
                <label>
                  <input
                    type="radio"
                    name={`share-payment-${request.id}`}
                    checked={getRideSharePaymentMethod(request) === "CASH"}
                    onChange={() => onUploadSlip(request.id, null, "CASH")}
                  />
                  Cash
                </label>
                <label>
                  <input
                    type="radio"
                    name={`share-payment-${request.id}`}
                    checked={getRideSharePaymentMethod(request) === "SLIP_UPLOAD"}
                    onChange={() => onUploadSlip(request.id, null, "SLIP_UPLOAD")}
                  />
                  Slip Upload
                </label>
              </div>
            </div>
          ) : null}
          <RideShareSlipPreview request={request} />
          {currentUser?.role === "USER"
          && request.userId === currentUser.id
          && request.status === "APPROVED"
          && getRideSharePaymentMethod(request) === "SLIP_UPLOAD" ? (
            <div className="slip-box">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => onUploadSlip(request.id, event.target.files?.[0], "SLIP_UPLOAD")}
              />
              {request.slipDataUrl ? (
                <button className="danger" type="button" onClick={() => onDeleteSlip(request.id)}>
                  Delete slip
                </button>
              ) : null}
            </div>
          ) : null}
          {currentUser?.role === "USER"
          && request.userId === currentUser.id
          && request.status === "APPROVED"
          && getRideSharePaymentMethod(request) === "CASH" ? (
            <p className="empty-state">Cash payment selected.</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function RideShareSlipPreview({ request }) {
  if (!request.slipDataUrl) {
    return <p>Slip file: Not uploaded</p>;
  }

  return (
    <div className="slip-preview">
      <div className="section-heading">
        <strong>Uploaded Payment Slip</strong>
        <a href={request.slipDataUrl} target="_blank" rel="noreferrer">
          Open full slip
        </a>
      </div>
      <p>Slip uploader: {request.userName}</p>
      <p>Slip file: {request.slipOriginalFileName || "Uploaded slip"}</p>
      {request.slipContentType?.startsWith("image/") ? (
        <img src={request.slipDataUrl} alt={`Payment slip for ride sharing request ${request.id}`} />
      ) : (
        <p className="empty-state">
          Preview is not available for {request.slipContentType || "this file type"}.
          Open the slip in a new tab.
        </p>
      )}
    </div>
  );
}

function DriverRideShareQueue({ requests, feeDrafts, setFeeDrafts, onApprove }) {
  if (!requests.length) {
    return <p className="empty-state">No incoming ride share requests.</p>;
  }

  return (
    <div className="request-grid">
      {requests.map((request) => (
        <article key={request.id} className="request-card">
          <div className="section-heading">
            <strong>{request.userName}</strong>
            <span className={`pill ${request.status.toLowerCase()}`}>{request.status}</span>
          </div>
          <p>Pickup: {request.currentLocation}</p>
          <p>Destination: {request.destination}</p>
          {request.status === "APPROVED" ? (
            <p className="approval-message">Approved fee: {request.fee}</p>
          ) : (
            <div className="approval-box">
              <input
                placeholder="Enter fee"
                value={feeDrafts[request.id] || ""}
                onChange={(event) =>
                  setFeeDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                }
              />
              <button type="button" onClick={() => onApprove(request.id)}>
                Approve Request
              </button>
            </div>
          )}
          <RideShareSlipPreview request={request} />
        </article>
      ))}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{formatLabel(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column}>{String(row[column] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatAvailability(value) {
  return value === "UNAVAILABLE" ? "Unavailable" : "Available";
}

function formatSlipUploader(rental) {
  if (rental.slipUploadedBy === "USER") {
    return rental.userName;
  }
  if (!rental.slipUploadedBy) {
    return "None";
  }
  return formatLabel(rental.slipUploadedBy.toLowerCase());
}

function getRentalPaymentMethod(rental, draft) {
  if (draft?.paymentMethod) {
    return draft.paymentMethod;
  }
  if (rental.hasPaymentSlip) {
    return "SLIP_UPLOAD";
  }
  return "CASH";
}

function getRideSharePaymentMethod(request) {
  if (request.paymentMethod) {
    return request.paymentMethod;
  }
  if (request.slipDataUrl) {
    return "SLIP_UPLOAD";
  }
  return "CASH";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read uploaded slip"));
    reader.readAsDataURL(file);
  });
}

export default App;
