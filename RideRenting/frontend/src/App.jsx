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
  imageUrl: "",
};

const initialRentalForm = {
  bikeId: "",
  hoursBooked: 1,
  pickupTime: "",
};

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
  const [bikeForm, setBikeForm] = useState(initialBikeForm);
  const [rentals, setRentals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [rentalForm, setRentalForm] = useState(initialRentalForm);
  const [slipState, setSlipState] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadBikes();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    localStorage.setItem("ride-renting-user", JSON.stringify(currentUser));
    hydrateRoleData(currentUser);
  }, [currentUser]);

  async function hydrateRoleData(user) {
    try {
      if (user.role === "OWNER") {
        setOwnerBikes(await api.getOwnerBikes(user.id));
        setRentals(await api.getOwnerRentals(user.id));
      } else if (user.role === "USER") {
        setRentals(await api.getUserRentals(user.id));
      } else if (user.role === "ADMIN") {
        setDashboard(await api.getDashboard());
        setRentals(await api.getAllRentals());
      } else if (user.role === "DRIVER") {
        setRentals(await api.getAllRentals());
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
    try {
      await api.createBike({
        ...bikeForm,
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        engineCapacityCc: Number(bikeForm.engineCapacityCc),
        hourlyRate: Number(bikeForm.hourlyRate),
      });
      setBikeForm(initialBikeForm);
      setOwnerBikes(await api.getOwnerBikes(currentUser.id));
      await loadBikes();
      setFeedback("Bike listed successfully");
    } catch (error) {
      setFeedback(error.message);
    }
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

  function logout() {
    setCurrentUser(null);
    setRentals([]);
    setOwnerBikes([]);
    setDashboard(null);
    localStorage.removeItem("ride-renting-user");
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
              <p>Signed in as</p>
              <strong>{currentUser.fullName}</strong>
              <span>{currentUser.role}</span>
              <button onClick={logout}>Logout</button>
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
                <img src={bike.imageUrl} alt={`${bike.brand} ${bike.model}`} />
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

        {currentUser?.role === "USER" ? (
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
              />
            </section>
          </>
        ) : null}

        {currentUser?.role === "OWNER" ? (
          <>
            <section className="panel">
              <h2>List a Motor Bicycle</h2>
              <form onSubmit={handleCreateBike} className="form-grid">
                {Object.entries(initialBikeForm).map(([key]) => (
                  <label key={key}>
                    {formatLabel(key)}
                    {key === "description" ? (
                      <textarea value={bikeForm[key]} onChange={(event) => setBikeForm({ ...bikeForm, [key]: event.target.value })} />
                    ) : (
                      <input value={bikeForm[key]} onChange={(event) => setBikeForm({ ...bikeForm, [key]: event.target.value })} />
                    )}
                  </label>
                ))}
                <button type="submit">Publish bike</button>
              </form>
            </section>

            <section className="panel">
              <h2>Owner Inventory</h2>
              <SimpleTable
                columns={["brand", "model", "registrationNumber", "hourlyRate", "status"]}
                rows={ownerBikes}
              />
            </section>

            <section className="panel">
              <h2>Owner Rental Queue</h2>
              <RentalList
                rentals={rentals}
                currentUser={currentUser}
                slipState={slipState}
                setSlipState={setSlipState}
                onUploadSlip={handleUploadSlip}
                onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
                onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
              />
            </section>
          </>
        ) : null}

        {currentUser?.role === "DRIVER" ? (
          <section className="panel">
            <h2>Driver Payment Validation</h2>
            <RentalList
              rentals={rentals}
              currentUser={currentUser}
              slipState={slipState}
              setSlipState={setSlipState}
              onUploadSlip={handleUploadSlip}
              onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
              onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
            />
          </section>
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
                onApprove={(rentalId) => handleRentalStatus(rentalId, "APPROVED")}
                onReject={(rentalId) => handleRentalStatus(rentalId, "REJECTED")}
                onComplete={(rentalId) => handleRentalStatus(rentalId, "COMPLETED")}
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
  onApprove,
  onReject,
  onComplete,
}) {
  if (!rentals.length) {
    return <p className="empty-state">No rentals available yet.</p>;
  }

  return (
    <div className="rental-grid">
      {rentals.map((rental) => (
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
          <p>Slip uploader: {rental.slipUploadedBy || "None"}</p>
          <p>Slip file: {rental.slipOriginalFileName || "Not uploaded"}</p>

          {rental.hasPaymentSlip ? (
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

          <div className="action-row">
            {onApprove ? <button onClick={() => onApprove(rental.id)}>Approve</button> : null}
            {onReject ? <button className="ghost" onClick={() => onReject(rental.id)}>Reject</button> : null}
            {onComplete ? <button className="ghost" onClick={() => onComplete(rental.id)}>Complete</button> : null}
          </div>
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

export default App;
