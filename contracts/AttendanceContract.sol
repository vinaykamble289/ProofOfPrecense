// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AttendanceContract (Standalone Version)
 * @dev Fully standalone blockchain attendance system without OpenZeppelin dependencies
 */
contract AttendanceContract {
    // ========================
    // Ownership
    // ========================
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    // ========================
    // ReentrancyGuard
    // ========================
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // ========================
    // Pausable
    // ========================
    bool private _paused;
    modifier whenNotPaused() {
        require(!_paused, "Contract paused");
        _;
    }
    modifier whenPaused() {
        require(_paused, "Contract not paused");
        _;
    }
    function pause() external onlyOwner {
        _paused = true;
    }
    function unpause() external onlyOwner {
        _paused = false;
    }

    // ========================
    // Data Structures
    // ========================
    struct AttendanceRecord {
        string sessionId;
        string ipfsHash;
        bytes32 merkleRoot;
        uint256 timestamp;
        address recordedBy;
        bool verified;
        uint256 studentCount;
        uint256 presentCount;
    }

    struct AuthorizedRecorder {
        bool isAuthorized;
        string institutionName;
        uint256 recordCount;
        uint256 authorizedAt;
    }

    mapping(string => AttendanceRecord) public attendanceRecords;
    mapping(address => AuthorizedRecorder) public authorizedRecorders;
    mapping(string => bool) public sessionExists;
    string[] public allSessionIds;

    // ========================
    // Events
    // ========================
    event AttendanceRecorded(
        string indexed sessionId,
        string ipfsHash,
        bytes32 merkleRoot,
        address indexed recordedBy,
        uint256 timestamp,
        uint256 studentCount,
        uint256 presentCount
    );
    event RecorderAuthorized(address indexed recorder, string institutionName, uint256 timestamp);
    event RecorderDeauthorized(address indexed recorder, uint256 timestamp);
    event AttendanceVerified(string indexed sessionId, address indexed verifiedBy, uint256 timestamp);

    // ========================
    // Modifiers
    // ========================
    modifier onlyAuthorizedRecorder() {
        require(authorizedRecorders[msg.sender].isAuthorized, "Not authorized to record attendance");
        _;
    }

    modifier sessionNotExists(string memory _sessionId) {
        require(!sessionExists[_sessionId], "Session ID already exists");
        _;
    }

    modifier sessionMustExist(string memory _sessionId) {
        require(sessionExists[_sessionId], "Session does not exist");
        _;
    }

    modifier validSessionId(string memory _sessionId) {
        require(bytes(_sessionId).length > 0, "Session ID cannot be empty");
        require(bytes(_sessionId).length <= 100, "Session ID too long");
        _;
    }

    modifier validIPFSHash(string memory _ipfsHash) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_ipfsHash).length <= 100, "IPFS hash too long");
        _;
    }

    // ========================
    // Constructor
    // ========================
    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
        _paused = false;

        // Authorize deployer
        authorizedRecorders[msg.sender] = AuthorizedRecorder({
            isAuthorized: true,
            institutionName: "Contract Deployer",
            recordCount: 0,
            authorizedAt: block.timestamp
        });
        emit RecorderAuthorized(msg.sender, "Contract Deployer", block.timestamp);
    }

    // ========================
    // Core Functions
    // ========================
    function recordAttendance(
        string memory _sessionId,
        string memory _ipfsHash,
        bytes32 _merkleRoot,
        uint256 _studentCount,
        uint256 _presentCount
    )
        external
        onlyAuthorizedRecorder
        nonReentrant
        whenNotPaused
        validSessionId(_sessionId)
        validIPFSHash(_ipfsHash)
        sessionNotExists(_sessionId)
    {
        require(_presentCount <= _studentCount, "Present count cannot exceed total student count");
        require(_merkleRoot != bytes32(0), "Merkle root cannot be empty");

        attendanceRecords[_sessionId] = AttendanceRecord({
            sessionId: _sessionId,
            ipfsHash: _ipfsHash,
            merkleRoot: _merkleRoot,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            verified: false,
            studentCount: _studentCount,
            presentCount: _presentCount
        });

        sessionExists[_sessionId] = true;
        allSessionIds.push(_sessionId);
        authorizedRecorders[msg.sender].recordCount++;

        emit AttendanceRecorded(
            _sessionId,
            _ipfsHash,
            _merkleRoot,
            msg.sender,
            block.timestamp,
            _studentCount,
            _presentCount
        );
    }

    function getAttendanceRecord(string memory _sessionId)
        external
        view
        sessionMustExist(_sessionId)
        returns (
            string memory sessionId,
            string memory ipfsHash,
            bytes32 merkleRoot,
            uint256 timestamp,
            address recordedBy,
            bool verified,
            uint256 studentCount,
            uint256 presentCount
        )
    {
        AttendanceRecord memory record = attendanceRecords[_sessionId];
        return (
            record.sessionId,
            record.ipfsHash,
            record.merkleRoot,
            record.timestamp,
            record.recordedBy,
            record.verified,
            record.studentCount,
            record.presentCount
        );
    }

    function verifyAttendance(string memory _sessionId)
        external
        sessionMustExist(_sessionId)
    {
        require(!attendanceRecords[_sessionId].verified, "Record already verified");
        attendanceRecords[_sessionId].verified = true;
        emit AttendanceVerified(_sessionId, msg.sender, block.timestamp);
    }

    function authorizeRecorder(address _recorder, string memory _institutionName) external onlyOwner {
        require(_recorder != address(0), "Cannot authorize zero address");
        require(bytes(_institutionName).length > 0, "Institution name cannot be empty");
        require(!authorizedRecorders[_recorder].isAuthorized, "Recorder already authorized");

        authorizedRecorders[_recorder] = AuthorizedRecorder({
            isAuthorized: true,
            institutionName: _institutionName,
            recordCount: 0,
            authorizedAt: block.timestamp
        });
        emit RecorderAuthorized(_recorder, _institutionName, block.timestamp);
    }

    function deauthorizeRecorder(address _recorder) external onlyOwner {
        require(_recorder != address(0), "Cannot deauthorize zero address");
        require(authorizedRecorders[_recorder].isAuthorized, "Recorder not authorized");

        authorizedRecorders[_recorder].isAuthorized = false;
        emit RecorderDeauthorized(_recorder, block.timestamp);
    }

    // ========================
    // Utility Functions
    // ========================
    function getTotalSessions() external view returns (uint256) {
        return allSessionIds.length;
    }

    function getSessionIdByIndex(uint256 _index) external view returns (string memory) {
        require(_index < allSessionIds.length, "Index out of bounds");
        return allSessionIds[_index];
    }

    function checkSessionStatus(string memory _sessionId)
        external
        view
        returns (bool exists, bool verified)
    {
        exists = sessionExists[_sessionId];
        if (exists) {
            verified = attendanceRecords[_sessionId].verified;
        }
    }

    function getRecorderStats(address _recorder)
        external
        view
        returns (
            uint256 totalRecords,
            uint256 totalStudents,
            uint256 totalPresent
        )
    {
        totalRecords = authorizedRecorders[_recorder].recordCount;
        for (uint256 i = 0; i < allSessionIds.length; i++) {
            AttendanceRecord memory record = attendanceRecords[allSessionIds[i]];
            if (record.recordedBy == _recorder) {
                totalStudents += record.studentCount;
                totalPresent += record.presentCount;
            }
        }
    }

    // ========================
    // Merkle Proof Verification
    // ========================
    function verifyMerkleProof(
        string memory _sessionId,
        bytes32[] memory _proof,
        bytes32 _leaf
    )
        external
        view
        sessionMustExist(_sessionId)
        returns (bool)
    {
        bytes32 merkleRoot = attendanceRecords[_sessionId].merkleRoot;
        return _verifyMerkleProof(_proof, _leaf, merkleRoot);
    }

    function _verifyMerkleProof(
        bytes32[] memory _proof,
        bytes32 _leaf,
        bytes32 _root
    )
        internal
        pure
        returns (bool)
    {
        bytes32 computedHash = _leaf;
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == _root;
    }
}
